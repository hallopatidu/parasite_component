
/**
 * Instance Inheritance Component | Implemented of Parasite Component.
 * - Extending this class to modify these methods of super class.
 * - Super Class would be a Class of the previous component in the same node.
 * - Instance is created by sub class of this class which can be extended the previous component in the same node (call by Inheritance Chain).
 * - The order of extending depend on the 'executionOrder' property of these components added to the node.
 * - All of methods are create by ParasiteComponent would be merged to the first component in the Inheritance Chain.
 * - Just using in the same node with super class
 * - Using with override decorator.
 * Author by hallopatidu@gmail.com
 */

const {ccclass, property} = cc._decorator;
const OVERRIDE_METHOD_MAP:string = '__$OverrideMethodMap__';

/**
 * Can add override method for this method.
 * @param target 
 * @param propertyKey 
 * @param descriptor 
 */
export function override(target: cc.Component, propertyKey: string, descriptor: PropertyDescriptor){
    if(propertyKey === 'onLoad') {
        cc.error('Do not support overriding ' + propertyKey + ' method');
        return;
    }     
    if(CC_DEV){
        if(!cc.js.isChildClassOf(target.constructor, ParasiteComponent)){
            cc.error('You should extending ParasiteComponent Class for this class to use @override');
        }
    }
    // 
    let listOfOverrideMethods:Set<string> = target[OVERRIDE_METHOD_MAP];       
    if(!listOfOverrideMethods){
        listOfOverrideMethods = target[OVERRIDE_METHOD_MAP] = new Set<string>();
    } 
    if(!listOfOverrideMethods.has(propertyKey)){
        listOfOverrideMethods.add(propertyKey);
    }
    // 
    
}


@ccclass
export default abstract class ParasiteComponent<SuperComponent=cc.Component> extends cc.Component {

    @property({
        displayName: 'Extends',        
        readonly:true
    })
    get superName():string{
        return this._$superName
    }

    protected _$host:cc.Component = null;
    protected _$super:cc.Component = null;    
    protected _$superName:string = '';
    protected super:SuperComponent&cc.Component = null;

    /**
     *
     */
    constructor() {        
        super();
        this.onLoad = ((previousOnLoad:Function)=> ()=>{
            this.__excuteHierarchyOverridding();
            this.__initSuper();
            return previousOnLoad ? previousOnLoad.call(this) : null;
        })(this.onLoad);

        this.onDestroy = ((previousDestroy:Function)=>function(){
            previousDestroy ? previousDestroy.call(this) : null;
            this.__restoreHost();
            this._$super = null;
            this._$host = null;
            delete this.super;
        })(this.onDestroy)
    }

    /**
     * 
     */
    private __excuteHierarchyOverridding(){
        const allNodeComponents:cc.Component[] = this.node.getComponents(cc.Component);
        const numberOfComponent:number = allNodeComponents.length;
        let hostComp:cc.Component = null;
        const behindCompIndex:number = allNodeComponents.findIndex((component:cc.Component, index:number, allComponents:cc.Component[])=>{  
            hostComp = cc.js.isChildClassOf(component.constructor, ParasiteComponent) ? hostComp : component;
            const nextComp:cc.Component = index < (numberOfComponent - 1) ? allComponents[index+1] : null;
            return nextComp && (nextComp == this) && !!component;
        })
        const behindComp:cc.Component = allNodeComponents[behindCompIndex];
        if(behindComp){
            this._$super = behindComp;
            this._$superName = cc.js.getClassName(behindComp);
            const adjacentComp:cc.Component = behindCompIndex < numberOfComponent - 2 ? allNodeComponents[behindCompIndex + 2] : null;
            if(!adjacentComp || (adjacentComp && !cc.js.isChildClassOf(adjacentComp.constructor, ParasiteComponent))){
                // the last Parasite Component.
                this._$host = hostComp;
            }
        }
        // 
        if(this._$super){
            const listOfOverrideMethods:Set<string> = this[OVERRIDE_METHOD_MAP];
            listOfOverrideMethods && listOfOverrideMethods.forEach((methodName:string)=>{
                const originMethodName:string = this.__getOriginMethodName(methodName);
                const thisDesc:PropertyDescriptor = cc.js.getPropertyDescriptor(this, methodName);
                const superDesc:PropertyDescriptor = this.getSuperPropertyDescriptor(this._$super, methodName);
                // 
                if(this._$host && thisDesc){
                    const hostDesc:PropertyDescriptor = cc.js.getPropertyDescriptor(this._$host, methodName);
                    Object.defineProperty(this, originMethodName, hostDesc);
                    if(hostDesc.get || hostDesc.set){
                        cc.js.getset(this._$host, 
                            methodName, 
                            thisDesc.get ? thisDesc.get.bind(this) : hostDesc.get, 
                            thisDesc.set ? thisDesc.set.bind(this) : hostDesc.set, 
                            thisDesc.enumerable, 
                            thisDesc.configurable)
                    }else if(hostDesc.value && typeof hostDesc.value == 'function'){
                        cc.js.value(this._$host, 
                            thisDesc.value ? thisDesc.value.bind(this) : hostDesc.value, 
                            thisDesc.enumerable || hostDesc.enumerable , 
                            thisDesc.configurable || hostDesc.configurable )
                    }else{
                        // If method is a normal attribute of host's class but you want to convert it to be a get/set method.
                        if(thisDesc.get || thisDesc.set){
                            cc.js.getset(this._$host, 
                                methodName, 
                                thisDesc.get ? thisDesc.get.bind(this) : ()=>{
                                    return this[originMethodName]
                                } , 
                                thisDesc.set ? thisDesc.set.bind(this): (value:any)=>{
                                    this[originMethodName] = value
                                }, 
                                thisDesc.enumerable, 
                                thisDesc.configurable)
                        }
                    }
                }else if(superDesc && thisDesc){
                    Object.defineProperty(this, originMethodName, superDesc);
                }
            })
        }        
    }

    /**
     * 
     */
    private __initSuper(){
        if(!this.super && this._$super){
            const superProxy = new Proxy(this, {
                get: (target:any, prop:string) => {
                    const originMethodName:string = this.__getOriginMethodName(prop);
                    if(target._$super){
                        return target[originMethodName] ? target[originMethodName].bind(target._$super) : target._$super[prop];
                    }else{
                        return function(){cc.error('khong ton tai super !')};
                    }
                },
                set:(target:any, prop:string, value:any):boolean => {                    
                    const originMethodName:string = this.__getOriginMethodName(prop);
                    const methodDesc:PropertyDescriptor = cc.js.getPropertyDescriptor(target, originMethodName);
                    if(methodDesc && methodDesc.set){
                        methodDesc.set.call(target._$super, value);
                        return true
                    }else if(target._$super){
                        target._$super[prop] = value;
                        return true
                    }
                    return false;
                }
            });
            // 
            Object.defineProperty(this, 'super', {
                get:()=>superProxy
            })
        }
    }
    
    /**
     * 
     */
    private __restoreHost(){
        if(this._$host){
            const listOfOverrideMethods:Set<string> = this[OVERRIDE_METHOD_MAP];
            listOfOverrideMethods && listOfOverrideMethods.forEach((methodName:string)=>{
                const originMethodName:string = this.__getOriginMethodName(methodName);
                const originDesc:PropertyDescriptor = cc.js.getPropertyDescriptor(this, originMethodName);
                if(originDesc){
                    Object.defineProperty(this._$host, methodName, originDesc);
                }
            })
        }
    }

    /**
     * 
     * @param methodName 
     * @returns 
     */
    private __getOriginMethodName(methodName:string):string{
        return '__$super::'+ methodName + '__';
    }

    /**
     * 
     * @param superTarget 
     * @param methodName 
     * @returns 
     */
    private getSuperPropertyDescriptor(superTarget:any, methodName:string):PropertyDescriptor{
        if(!superTarget){
            return null
        }        
        return cc.js.getPropertyDescriptor(superTarget, methodName) || this.getSuperPropertyDescriptor(superTarget._$super, methodName)
    }

}