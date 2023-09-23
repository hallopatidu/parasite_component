
/**
 * Instance Inheritance Component | Implemented of Parasite Component.
 * - Extending this class to modify these methods of super class.
 * - Super Class would be a Class of the previous component in the same node.
 * - Instance is created by sub class of this class which can be extended the previous component in the same node (call by Inheritance Chain).
 * - The order of extending depend on the 'executionOrder' property of these components added to the node.
 * - All of methods are create by ParasiteComponent would be merged to the first component in the Inheritance Chain.
 * - Just using in the same node with super class
 * - Using with override decorator.
 * 
 * Note: If you understand How and Why this component work in the first time reading. Congratulation ! You are really a tallent developer.
 * Author by hallopatidu@gmail.com
 */

import { error, warn } from "cc";
import { _decorator } from "cc";
import { js } from "cc";
import { Component } from "cc";
import { DEV } from "cc/env";

const { ccclass, property } = _decorator;

const PARASITE_TEST_MODE:boolean = false && DEV;

const OverrideMethodNameMap = Symbol();
const CheckEligibleForInheritance = Symbol();
const ExcuteHierarchyOverridding = Symbol();
const InitSuper = Symbol();
const GetParasiteSuperMethod = Symbol();
const SetParasiteSuperMethod = Symbol();
const GetOriginMethodName = Symbol();

/**
 * Can add override method for this method.
 * @param target 
 * @param propertyKey 
 * @param descriptor 
 */
export function override(target: Component, propertyKey: string, descriptor: PropertyDescriptor){
    if(propertyKey === '__preload') {
        error('Do not support overriding ' + propertyKey + ' method');
        return;
    }     
    if(DEV){
        if(!js.isChildClassOf(target.constructor, ParasiteComponent)){
            error('You should extending ParasiteComponent Class for this class to use @override');
        }
    }
    // 
    let listOfOverrideMethods:Set<string> = target[OverrideMethodNameMap];       
    if(!listOfOverrideMethods){
        listOfOverrideMethods = target[OverrideMethodNameMap] = new Set<string>();
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
        this.__preload = ((previousOnLoad:Function)=> ()=>{
            this[ExcuteHierarchyOverridding]();
            this[InitSuper]();            
            return previousOnLoad ? previousOnLoad.call(this) : null;
        })(this.__preload);

        this.onDestroy = ((previousDestroy:Function)=>function(){
            previousDestroy ? previousDestroy.call(this) : null;            
            this.enabled = false;
            const allParasiteComponents:ParasiteComponent[] = this.node.getComponents(ParasiteComponent);
            allParasiteComponents.forEach((parasiteComp:ParasiteComponent)=> parasiteComp !== this && parasiteComp[ExcuteHierarchyOverridding]());        
            this._$super = null;
            if(this.super){ delete this.super;};
        })(this.onDestroy)

        // this.onEnable = ((previousOnEnable:Function)=>function(){
        //     previousOnEnable ? previousOnEnable.call(this) : undefined;
        //     DEV && log('--> enabled ' + js.getClassName(this) )
        //     if(this.node && !this._$super){                
        //         const allParasiteComponents:ParasiteComponent[] = this.node.getComponents(ParasiteComponent);
        //         allParasiteComponents.forEach((parasiteComp:ParasiteComponent)=> parasiteComp[ExcuteHierarchyOverridding]());
        //     }
        // })(this.onEnable);

        // this.onDisable= ((previousOnDisable:Function)=>function(){
        //     previousOnDisable ? previousOnDisable.call(this) : undefined;
        //     DEV && log('--> disabled ' + js.getClassName(this) )
        //     if(this.node && !this._$super){                         
        //         const allParasiteComponents:ParasiteComponent[] = this.node.getComponents(ParasiteComponent);
        //         allParasiteComponents.forEach((parasiteComp:ParasiteComponent)=> parasiteComp[ExcuteHierarchyOverridding]());
        //     }
        // })(this.onEnable);
    }

    /**
     * 
     * @param component 
     * @returns 
     */
    [CheckEligibleForInheritance](component:Component):boolean{
        return Boolean(!!component && component.enabled)
    }

    /**
     * 
     */
    [ExcuteHierarchyOverridding](){ 
        if(!this.enabled) return;
        const allNodeComponents:ReadonlyArray<Component> = this.node.components;
        const numberOfComponent:number = allNodeComponents.length;
        let hostComp:Component = null;
        let firstParasite:Component = null;
        // Investigate parasite component. Purpose to find out the previous component which would be become a super of this component.
        const previousCompIndex:number = allNodeComponents.findIndex((component:Component, index:number, allComponents:Component[])=>{
            const eligibleForInheritance:boolean = this[CheckEligibleForInheritance](component)          
            let investigateComp:Component = null;
            if(eligibleForInheritance){
                const componentIsParasite:boolean = js.isChildClassOf(component.constructor, ParasiteComponent);
                hostComp = componentIsParasite ? hostComp : component;                
                let enabledIndex:number = index;
                // Search enabled nextComp
                while(enabledIndex < numberOfComponent - 1){
                    investigateComp = allComponents[++enabledIndex];
                    if(this[CheckEligibleForInheritance](investigateComp)){                    
                        break;
                    }else{
                        continue;
                    }
                }
                firstParasite = investigateComp && !componentIsParasite ? investigateComp : firstParasite;
            }
            return eligibleForInheritance && investigateComp && (investigateComp == this);
        })
        // 
        this._$id = previousCompIndex + 1;
        const previousComponent:Component = allNodeComponents[previousCompIndex];
        if(previousComponent){
            this._$super = previousComponent;
            this._$superName = js.getClassName(previousComponent);
        }
        // 
        if(this._$super){
            const listOfOverrideMethods:Set<string> = this[OverrideMethodNameMap];
            listOfOverrideMethods && listOfOverrideMethods.forEach((methodName:string)=>{
                const hostDesc:PropertyDescriptor = js.getPropertyDescriptor(hostComp, methodName);
                if(hostDesc){
                    const originMethodName:string = this[GetOriginMethodName](methodName);
                    const thisDesc:PropertyDescriptor = js.getPropertyDescriptor(this, methodName);
                    if(firstParasite && !Object.prototype.hasOwnProperty.call(firstParasite, originMethodName)){    
                        // the frist parasite saved all origin method.                
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
                    PARASITE_TEST_MODE && warn('The method ' + methodName + ' do not exist in the Host: ' + js.getClassName(hostComp));
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
    [InitSuper](){
        if(this._$super){
            const superProxy:ProxyConstructor = new Proxy(this, {  
                get: (target:any, prop:string) => this[GetParasiteSuperMethod](target, prop),           
                set: (target:any, prop:string, value:any) =>{                    
                    return this[SetParasiteSuperMethod](target, prop, value)
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
    [GetParasiteSuperMethod](target:any, methodName:string):Function{
        if(!target || !target._$super){
            return undefined;
        }
        const originMethodName:string = this[GetOriginMethodName](methodName);
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
                return this[GetParasiteSuperMethod](target._$super, methodName);
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
    [SetParasiteSuperMethod](target:any, methodName:string, value:any = undefined):boolean{
        if(!target || !target._$super){
            return false
        }
        const originMethodName:string = this[GetOriginMethodName](methodName);
        const thisDesc:PropertyDescriptor = js.getPropertyDescriptor(target, originMethodName)
        if(thisDesc && thisDesc.set){
            thisDesc.set.call(target._$super, value)
            return true;
        }else{
            const desc:PropertyDescriptor = js.getPropertyDescriptor(target._$super, methodName)
            if(desc && desc.set){
                desc.set.call(target._$super, value);
                return true;
            }else if(desc && Object.prototype.hasOwnProperty.call(desc, 'value')){
                target._$super[methodName] = value;
                return true;
            }else{
                return this[SetParasiteSuperMethod](target._$super, methodName, value);
            }
        }
    }

    
    /**
     * 
     * @param methodName 
     * @returns 
     */
    [GetOriginMethodName](methodName:string):string{
        return '__$super::'+ methodName + '__';
    }
    

}
