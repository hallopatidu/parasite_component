
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

    // protected _$first:cc.Component = null;
    // protected _$host:cc.Component = null;
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
            if(this._$host){
                const listOfOverrideMethods:Set<string> = this[OVERRIDE_METHOD_MAP];
                listOfOverrideMethods && listOfOverrideMethods.forEach((methodName:string)=>{
                    const originMethodName:string = this.__getOriginMethodName(methodName);
                    const originDesc:PropertyDescriptor = cc.js.getPropertyDescriptor(this, originMethodName);
                    if(originDesc){
                        Object.defineProperty(this._$host, methodName, originDesc);
                        delete this[originMethodName];
                    }
                })                
            }
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
        let firstParasite:cc.Component = null;
        let isFinalParasite:boolean = false;
        const behindCompIndex:number = allNodeComponents.findIndex((component:cc.Component, index:number, allComponents:cc.Component[])=>{
            const componentIsParasite:boolean = cc.js.isChildClassOf(component.constructor, ParasiteComponent);
            hostComp = componentIsParasite ? hostComp : component;            
            // firstParasite = index - 1 >= 0 && !cc.js.isChildClassOf(allComponents[index-1].constructor, ParasiteComponent) ? component : firstParasite;
            let nextComp:cc.Component = null;
            if(index < numberOfComponent - 1){
                nextComp = allComponents[index+1]
                firstParasite = nextComp && !componentIsParasite ? nextComp : firstParasite;
            }
            // const nextComp:cc.Component = index < (numberOfComponent - 1) ? allComponents[index+1] : null;
            return nextComp && (nextComp == this) && !!component;
        })
        const behindComp:cc.Component = allNodeComponents[behindCompIndex];
        if(behindComp){
            this._$super = behindComp;
            this._$superName = cc.js.getClassName(behindComp);
            const adjacentComp:cc.Component = behindCompIndex < numberOfComponent - 2 ? allNodeComponents[behindCompIndex + 2] : null;
            if(!adjacentComp || (adjacentComp && !cc.js.isChildClassOf(adjacentComp.constructor, ParasiteComponent))){
                // the last Parasite Component.       
                isFinalParasite = true;
            }
            // else{
            //     delete this._$host;
            // }            
            cc.log('------ behindComp: ' + cc.js.getClassName(behindComp) )
            // cc.log('------ this: ' + cc.js.getClassName(this) )
            isFinalParasite ? cc.log('------ hostComp: ' + cc.js.getClassName(hostComp) ) : null
        }
        // 
        if(this._$super){
            const listOfOverrideMethods:Set<string> = this[OVERRIDE_METHOD_MAP];
            listOfOverrideMethods && listOfOverrideMethods.forEach((methodName:string)=>{
                const originMethodName:string = this.__getOriginMethodName(methodName);
                const thisDesc:PropertyDescriptor = cc.js.getPropertyDescriptor(this, methodName);
                const hostDesc:PropertyDescriptor = cc.js.getPropertyDescriptor(hostComp, methodName);
                //
                if(firstParasite && hostDesc && !Object.prototype.hasOwnProperty.call(firstParasite, originMethodName)){                    
                    Object.defineProperty(firstParasite, originMethodName, hostDesc);                    
                    // if(hostDesc){
                    //     if(hostDesc.get || hostDesc.set){
                    //         cc.js.getset(firstParasite, 
                    //             originMethodName, 
                    //             hostDesc.get?.bind(hostComp), 
                    //             hostDesc.set?.bind(hostComp), 
                    //             hostDesc.enumerable, 
                    //             hostDesc.configurable);
                    //     }else if(hostDesc.value !== undefined && typeof hostDesc.value == 'function'){
                    //         cc.js.value(firstParasite, originMethodName, hostDesc.value.bind(hostComp), hostDesc.enumerable, hostDesc.configurable)
                    //     }
                    // }
                }
                // 
                if(isFinalParasite && thisDesc && firstParasite){
                    // const hostDesc:PropertyDescriptor = cc.js.getPropertyDescriptor(this._$host, methodName);
                    if(hostDesc){
                        // Object.defineProperty(this, originMethodName, hostDesc);
                        if(hostDesc.get || hostDesc.set){
                            cc.log('register get/set')
                            // cc.js.getset(firstParasite, 
                            //     originMethodName, 
                            //     hostDesc.get ? hostDesc.get.bind(this._$host): null, 
                            //     hostDesc.set ? hostDesc.set.bind(this._$host): null, 
                            //     hostDesc.enumerable, 
                            //     hostDesc.configurable);
                            delete hostComp[methodName];
                            cc.js.getset(hostComp, 
                                methodName, 
                                thisDesc.get ? thisDesc.get.bind(this) : hostDesc.get.bind(hostComp), 
                                thisDesc.set ? thisDesc.set.bind(this) : hostDesc.set.bind(hostComp),
                                thisDesc.enumerable, 
                                thisDesc.configurable);

                        }else if(hostDesc.value !== undefined && typeof hostDesc.value == 'function'){
                            cc.log('register function')
                            // cc.js.value(firstParasite, originMethodName, hostDesc.value.bind(this._$host), hostDesc.enumerable, hostDesc.configurable)
                            cc.js.value(hostComp, 
                                thisDesc.value ? thisDesc.value.bind(this) : hostDesc.value.bind(hostComp), 
                                thisDesc.enumerable || hostDesc.enumerable , 
                                thisDesc.configurable || hostDesc.configurable );

                        }else{
                            cc.log('register property')
                            // If method is a normal attribute of host's class but you want to convert it to be a get/set method.                            
                            if(thisDesc.get || thisDesc.set){                                
                                // Object.defineProperty(firstParasite, originMethodName, hostDesc);
                                cc.js.getset(hostComp, 
                                    methodName, 
                                    thisDesc.get ? thisDesc.get.bind(this) : ()=>{
                                        return firstParasite[originMethodName]
                                    } ,         
                                    thisDesc.set ? thisDesc.set.bind(this): (value:any)=>{
                                        firstParasite[originMethodName] = value
                                    }, 
                                    thisDesc.enumerable,
                                    thisDesc.configurable)
                            }
                        }
                    }

                }           
                else{
                    delete this[originMethodName];
                }
                // 
            })
            // 
        }      
        //   
    }

    /**
     * 
     */
    private __initSuper(){
        if(this._$super){
            const superProxy:ProxyConstructor = new Proxy(this, {  
                get: (target:any, prop:string) => this.__getParasiteSuperMethod(target, prop),           
                set: (target:any, prop:string, value:any) =>{                    
                    return this.__setParasiteSuperMethod(target, prop, value)
                }
            });
            delete this.super;
            // 
            Object.defineProperty(this, 'super', {
                get:()=>superProxy
            })
        }
    }

    /**
     * 
     * @param target 
     * @param methodName 
     * @returns 
     */
    private __getParasiteSuperMethod(target:any, methodName:string):Function{
        if(!target){
            return null;
        }
        const originMethodName:string = this.__getOriginMethodName(methodName);
        const thisDesc:PropertyDescriptor = cc.js.getPropertyDescriptor(target, originMethodName);
        if(thisDesc && thisDesc.get){
            return thisDesc.get.bind(target._$super)
        }else if(thisDesc && thisDesc.value && typeof thisDesc.value == 'function'){
            return thisDesc.value.bind(target._$super)
        }else{
            const desc:PropertyDescriptor = cc.js.getPropertyDescriptor(target._$super, methodName);
            if(desc && desc.get){
                return desc.get.bind(target._$super)
            }else{
                return this.__getParasiteSuperMethod(target._$super, methodName);
            }
        }
        // 
    }
    
    /**
     * 
     * @param target 
     * @param methodName 
     * @param value 
     * @returns 
     */
    private __setParasiteSuperMethod(target:any, methodName:string, value:any = undefined):boolean{
        if(!target){
            return false
        }
        const originMethodName:string = this.__getOriginMethodName(methodName);
        const thisDesc:PropertyDescriptor = cc.js.getPropertyDescriptor(target, originMethodName)
        if(thisDesc && thisDesc.set){
            thisDesc.set.call(target._$super, value)
            return true;
        }else{
            const desc:PropertyDescriptor = cc.js.getPropertyDescriptor(target._$super, methodName)
            if(desc && desc.set){
                // target._$super[methodName] = value;
                desc.set.call(target._$super, value)
                return true;
            }else{
                return this.__setParasiteSuperMethod(target._$super, methodName, value);
            }
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
    

}
