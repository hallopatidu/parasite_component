
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

import { error, warn } from "cc";
import { _decorator } from "cc";
import { log } from "cc";
import { js } from "cc";
import { Component } from "cc";
import { DEV } from "cc/env";

const { ccclass, property } = _decorator;

// const OVERRIDE_METHOD_MAP:string = '__$OverrideMethodMap__';
const OVERRIDE_METHOD_MAP = Symbol();
const excuteHierarchyOverridding = Symbol();
const initSuper = Symbol();
const getParasiteSuperMethod = Symbol();
const setParasiteSuperMethod = Symbol();
const getOriginMethodName = Symbol();

/**
 * Can add override method for this method.
 * @param target 
 * @param propertyKey 
 * @param descriptor 
 */
export function override(target: Component, propertyKey: string, descriptor: PropertyDescriptor){
    if(propertyKey === 'onLoad') {
        error('Do not support overriding ' + propertyKey + ' method');
        return;
    }     
    if(DEV){
        if(!js.isChildClassOf(target.constructor, ParasiteComponent)){
            error('You should extending ParasiteComponent Class for this class to use @override');
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



@ccclass('ParasiteComponent')
export default abstract class ParasiteComponent<SuperComponent=Component> extends Component {

    @property({
        displayName: 'Extends',        
        readonly:true
    })
    get superName():string{
        return this._$superName
    }

    protected _$id:number = 0;
    protected _$super:Component = null;    
    protected _$superName:string = '';
    protected super:SuperComponent&Component = null;

    /**
     *
     */
    constructor() {        
        super();
        this.onLoad = ((previousOnLoad:Function)=> ()=>{
            this[excuteHierarchyOverridding]();
            this[initSuper]();
            return previousOnLoad ? previousOnLoad.call(this) : null;
        })(this.onLoad);

        this.onDestroy = ((previousDestroy:Function)=>function(){
            previousDestroy ? previousDestroy.call(this) : null;
            if(this._$host){
                const listOfOverrideMethods:Set<string> = this[OVERRIDE_METHOD_MAP];
                listOfOverrideMethods && listOfOverrideMethods.forEach((methodName:string)=>{
                    const originMethodName:string = this[getOriginMethodName](methodName);
                    const originDesc:PropertyDescriptor = js.getPropertyDescriptor(this, originMethodName);
                    if(originDesc){
                        Object.defineProperty(this._$host, methodName, originDesc);
                        delete this[originMethodName];
                    }
                })                
            }
            this._$super = null;
            this._$host = null;
            if(this.super){ delete this.super;};
        })(this.onDestroy)
    }

    /**
     * 
     */
    [excuteHierarchyOverridding](){ 
        const allNodeComponents:ReadonlyArray<Component> = this.node.components;
        const numberOfComponent:number = allNodeComponents.length;
        let hostComp:Component = null;
        let firstParasite:Component = null;
        let isFinalParasite:boolean = false;
        const behindCompIndex:number = allNodeComponents.findIndex((component:Component, index:number, allComponents:Component[])=>{
            const componentIsParasite:boolean = js.isChildClassOf(component.constructor, ParasiteComponent);
            hostComp = componentIsParasite ? hostComp : component;
            let nextComp:Component = null;
            if(index < numberOfComponent - 1){
                nextComp = allComponents[index+1];
                firstParasite = nextComp && !componentIsParasite ? nextComp : firstParasite;
            }
            return nextComp && (nextComp == this) && !!component;
        })
        this._$id = behindCompIndex + 1;
        const behindComp:Component = allNodeComponents[behindCompIndex];
        if(behindComp){
            this._$super = behindComp;
            this._$superName = js.getClassName(behindComp);
            const adjacentComp:Component = behindCompIndex < numberOfComponent - 2 ? allNodeComponents[behindCompIndex + 2] : null;
            if(!adjacentComp || (adjacentComp && !js.isChildClassOf(adjacentComp.constructor, ParasiteComponent))){
                // the last Parasite Component.       
                isFinalParasite = true;
            }
        }
        // 
        if(this._$super){
            const listOfOverrideMethods:Set<string> = this[OVERRIDE_METHOD_MAP];
            listOfOverrideMethods && listOfOverrideMethods.forEach((methodName:string)=>{
                const hostDesc:PropertyDescriptor = js.getPropertyDescriptor(hostComp, methodName);
                if(hostDesc){
                    const originMethodName:string = this[getOriginMethodName](methodName);
                    const thisDesc:PropertyDescriptor = js.getPropertyDescriptor(this, methodName);
                    if(firstParasite && !Object.prototype.hasOwnProperty.call(firstParasite, originMethodName)){                    
                        Object.defineProperty(firstParasite, originMethodName, hostDesc);
                    }
                    // 
                    if(thisDesc && firstParasite){                        
                        if(hostDesc.get || hostDesc.set){                          
                            delete hostComp[methodName];
                            js.getset(hostComp, 
                                methodName, 
                                thisDesc.get ? thisDesc.get.bind(this) : hostDesc.get.bind(hostComp), 
                                thisDesc.set ? thisDesc.set.bind(this) : hostDesc.set.bind(hostComp),
                                thisDesc.enumerable, 
                                thisDesc.configurable);

                        }else if(hostDesc.value !== undefined && typeof hostDesc.value == 'function'){
                            js.value(hostComp,
                                methodName,
                                thisDesc.value ? thisDesc.value.bind(this) : hostDesc.value.bind(hostComp), 
                                thisDesc.writable || hostDesc.writable,
                                thisDesc.enumerable || hostDesc.enumerable);
                            
                        }else{                            
                            // If method is a normal attribute of host's class but you want to convert it to be a get/set method.                            
                            if(thisDesc.get || thisDesc.set){                                
                                js.getset(hostComp, 
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

                    }else{
                        delete this[originMethodName];
                    }
                }else{
                    warn('The method ' + methodName + ' do not exist in the Host Component.');
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
    [initSuper](){
        if(this._$super){
            const superProxy:ProxyConstructor = new Proxy(this, {  
                get: (target:any, prop:string) => this[getParasiteSuperMethod](target, prop),           
                set: (target:any, prop:string, value:any) =>{                    
                    return this[setParasiteSuperMethod](target, prop, value)
                }
            });
            if(this.super){ delete this.super;};
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
    [getParasiteSuperMethod](target:any, methodName:string):Function{
        if(!target || !target._$super){
            return undefined;
        }
        const originMethodName:string = this[getOriginMethodName](methodName);
        const thisDesc:PropertyDescriptor = js.getPropertyDescriptor(target, originMethodName);
        if(thisDesc && thisDesc.get){
            return thisDesc.get.call(target._$super)
        }else if(thisDesc && thisDesc.value && typeof thisDesc.value == 'function'){
            return thisDesc.value.bind(target._$super)
        }else{
            const desc:PropertyDescriptor = js.getPropertyDescriptor(target._$super, methodName);
            if(desc && desc.get){
                return desc.get.call(target._$super)
            }else if(desc && Object.prototype.hasOwnProperty.call(desc, 'value')){
                return desc.value;
            }else{
                return this[getParasiteSuperMethod](target._$super, methodName);
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
    [setParasiteSuperMethod](target:any, methodName:string, value:any = undefined):boolean{
        if(!target || !target._$super){
            return false
        }
        const originMethodName:string = this[getOriginMethodName](methodName);
        const thisDesc:PropertyDescriptor = js.getPropertyDescriptor(target, originMethodName)
        if(thisDesc && thisDesc.set){
            thisDesc.set.call(target._$super, value)
            return true;
        }else{
            const desc:PropertyDescriptor = js.getPropertyDescriptor(target._$super, methodName)
            if(desc && desc.set){
                desc.set.call(target._$super, value)
                return true;
            }else if(desc && Object.prototype.hasOwnProperty.call(desc, 'value')){
                target._$super[methodName] = value;
                return true;
            }else{
                return this[setParasiteSuperMethod](target._$super, methodName, value);
            }
        }
    }

    
    /**
     * 
     * @param methodName 
     * @returns 
     */
    [getOriginMethodName](methodName:string):string{
        return '__$super::'+ methodName + '__';
    }
    

}
