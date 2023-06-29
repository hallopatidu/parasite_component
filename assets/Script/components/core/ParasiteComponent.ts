// import { _decorator, Component, Enum, error, js, Node } from 'cc';
// import { DEV } from 'cc/env';
const { ccclass, property } = cc._decorator;
const OVERRIDE_METHOD_MAP:string = '__$OverrideMethodMap__';
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
    

}

// enum ParasiteType{
//     SIMPLE,
//     INHERITANCE
// }

// Enum(ParasiteType)

@ccclass('ParasiteComponent')
export abstract class ParasiteComponent<SuperComponent=cc.Component> extends cc.Component {

    // @property({
    //     type:ParasiteType
    // })
    // type:ParasiteType = 0
    
    @property({
        displayName: 'Extends',        
        readonly:true
    })
    get superName():string{
        return this._$superName
    }

    private _$host:cc.Component = null;
    private _$super:cc.Component = null;    
    private _$superName:string = null;
    protected super:SuperComponent&cc.Component = null;    

    /**
     *
     */
    constructor() {        
        super();
        this.onLoad = ((previousOnLoad:Function)=> ()=>{
            // if(!this.super){        
                const listOfOverrideMethods:Set<string> = this[OVERRIDE_METHOD_MAP];
                const allNodeComponents:cc.Component[] = this.node.getComponents(cc.Component);
                const numberOfComponent:number = allNodeComponents.length;
                const adjacentComp:cc.Component = allNodeComponents.find((component:cc.Component, index:number, allComponents:cc.Component[])=>{                    
                    const nextComp:cc.Component = index < (numberOfComponent - 1) ? allComponents[index+1] : null;
                    return (nextComp == this) && !!component;
                })
                if(adjacentComp){
                    this._$super = adjacentComp;
                    this._$superName = cc.js.getClassName(adjacentComp)
                    if(cc.js.isChildClassOf(adjacentComp.constructor, ParasiteComponent)){
                        this._$host = adjacentComp['_$host'];
                    }else{
                        this._$host = adjacentComp;
                    }
                    // 
                    if(this._$host && this._$super){
                        // 
                        // override all of methods has @override decorator tag.
                        listOfOverrideMethods && listOfOverrideMethods.forEach((methodName:string)=>{
                            const originMethodName:string = '__$super'+ methodName + '__';
                            const originHostMethod:Function = this._$host[originMethodName];
                            if(!originHostMethod){
                                Object.defineProperty(this._$host, originMethodName, cc.js.getPropertyDescriptor(this._$host, methodName));
                            }
                            const thisDesc:PropertyDescriptor = cc.js.getPropertyDescriptor(this, methodName);
                            const hostDesc:PropertyDescriptor = cc.js.getPropertyDescriptor(this._$host, methodName);                            
                            if(thisDesc){
                                if(hostDesc.get || hostDesc.set){                                    
                                    cc.js.getset(this._$host, 
                                        methodName, 
                                        thisDesc.get ? thisDesc.get.bind(this) : hostDesc.get.bind(this._$host) , 
                                        thisDesc.set ? thisDesc.set.bind(this): hostDesc.set.bind(this._$host), 
                                        thisDesc.enumerable, 
                                        thisDesc.configurable);
                                    
                                }else if(hostDesc.value && typeof hostDesc.value == 'function'){                                    
                                    // Rewrite the host's method by this[methodName].
                                    this._$host[methodName] = this[methodName].bind(this);
                                }else {        
                                    // If method is a normal attribute of host's class but you want to convert it to be a get/set method.                               
                                    if(thisDesc.get || thisDesc.set){                                                                                     
                                        cc.js.getset(this._$host, 
                                            methodName, 
                                            thisDesc.get ? thisDesc.get.bind(this) : ()=>{
                                                return this._$host[originMethodName]
                                            } , 
                                            thisDesc.set ? thisDesc.set.bind(this): (value:any)=>{
                                                this._$host[originMethodName] = value
                                            }, 
                                            thisDesc.enumerable, 
                                            thisDesc.configurable)
                                    }
                                    // else{
                                    //     Object.defineProperty(this._$host, methodName, thisDesc);
                                    // }
                                }
                            }
                            
                        });
                        // 
                        const superProxy = new Proxy(this._$super, {
                            get: (target:any, prop:string) => {
                                if(listOfOverrideMethods && listOfOverrideMethods.has(prop)){
                                    return this.getSuperMethod(target, prop)
                                }
                                return function(){cc.error('Do not exist "' + prop + '" function or property  of ' + cc.js.getClassName(target) + ' component.')};
                            },
                            set:(target:any, prop:string, value:any):boolean => {
                                if(listOfOverrideMethods && listOfOverrideMethods.has(prop)){
                                    this.setSuperMethod(target, prop, value)
                                    return true;
                                }
                                return false;
                            }
                        })
                        Object.defineProperty(this, 'super', {
                            get:()=>superProxy
                        })
                    }else{
                        cc.error("Can't override")
                    }
                // }
            }
            return previousOnLoad ? previousOnLoad.call(this) : null;
        })(this.onLoad);

        this.onDestroy = ((previousDestroy:Function)=>function(){            
            previousDestroy ? previousDestroy.call(this) : null;
            // const listOfOverrideMethods:Set<string> = this[OVERRIDE_METHOD_MAP];
            // listOfOverrideMethods.forEach((methodName:string)=>{
            //     const originMethodName:string = '__$super'+ methodName + '__';
            //     if(this._$host && this._$host[originMethodName] && ){
            //         this._$host[originMethodName] 
            //     }
            //     delete this[originMethodName];
            // }) 
            this._$super = null;
            this._$host = null;
            delete this.super;
        })(this.onDestroy)
    }

    /**
     * 
     * @param superTarget 
     * @param methodName 
     * @returns 
     */
    private getSuperMethod(superTarget:any, methodName:string):Function|null{
        if(!superTarget){
            return null
        }
        const methodDesc:PropertyDescriptor = cc.js.getPropertyDescriptor(superTarget, methodName);
        if(methodDesc && (methodDesc.value || methodDesc.get)){
            return (methodDesc.value || methodDesc.get).bind(superTarget);
        }else{
            return this.getSuperMethod(superTarget._$super, methodName);
        }        
    }

    /**
     * 
     * @param superTarget 
     * @param methodName 
     * @param value 
     * @returns 
     */
    private setSuperMethod(superTarget:any, methodName:string, value:any):boolean{
        if(!superTarget){
            return false
        }
        const originMethodName:string = '__$super'+ methodName + '__';
        const methodDesc:PropertyDescriptor = cc.js.getPropertyDescriptor(superTarget, originMethodName) || cc.js.getPropertyDescriptor(superTarget, methodName);
        if(methodDesc && methodDesc.set){
            methodDesc.set.call(superTarget, value)
            return true;
        }else if(methodDesc){
            superTarget[methodName] = value;
        }else{
            return this.setSuperMethod(superTarget._$super, methodName, value);
        } 
    }


}

