import { _decorator, Component, error, js, Node } from 'cc';
import { DEV } from 'cc/env';
const { ccclass, property } = _decorator;
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
function getSuperMethod(target:any, methodName:string):Function{
    if(!target._super || !target._root){
        return null
    }
    // In the case, this component is a first parasite component, we get function method from prototype of super.
    // In other case, these funtions would be get from the super instance.
    const superTarget:any = (target._super === target._root) ? Object.getPrototypeOf(target._super) : target._super;    
    const superFuntion:Function = superTarget[methodName];
    if(superFuntion){
        return superFuntion.bind(target._super);
    }else{
        return getSuperMethod(target._super, methodName);
    }
}

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
        if(!(js.getSuper(target.constructor) == ParasiteComponent)){
            error('You should extending ParasiteComponent Class for this class to use @override');
        }
    }
    const methodName:string = propertyKey;
    let hasNewParasiteClass:boolean = false;
    let hasNewParasiteMethod:boolean = false;
    let listOfOverrideMethods:Set<string> = target[OVERRIDE_METHOD_MAP];       
    if(!listOfOverrideMethods){
        listOfOverrideMethods = target[OVERRIDE_METHOD_MAP] = new Set<string>();
        hasNewParasiteClass = true
    } 
    if(!listOfOverrideMethods.has(propertyKey)){
        listOfOverrideMethods.add(propertyKey);
        hasNewParasiteMethod = true
    }
    if(hasNewParasiteClass && hasNewParasiteMethod){
        target['onLoad'] = ((previousOnLoad:Function)=> function(){
            if(!this.enabled) return;
            if(!this.super){
                const comps:Component[] = this.node.getComponents(Component);
                let lastComponent:Component;
                for (let index = 0; index < comps.length; index++) {  
                    const comp:any = comps[index];
                    if(!comp) continue;
                    if(lastComponent && comp === this){
                        if(lastComponent && lastComponent['_super']){
                            this._root = lastComponent['_root'] 
                        }else{
                            this._root = lastComponent
                        }                        
                        this._super = lastComponent;
                        this._superName = js.getClassName(this._super) + ' <' + this._root['node']?.name + '>';
                        // Initianizing the inheritance instance with 'this.super' property
                        if(this._super && this._root){
                            // override all of methods has @override decorator tag.
                            listOfOverrideMethods.forEach((methodName:string)=>{
                                const originMethodName:string = '__super'+ methodName + '__';
                                const originSuperMethod:Function = this[originMethodName];
                                if(!originSuperMethod){
                                    const descriptor:PropertyDescriptor = js.getPropertyDescriptor(this._root, methodName);
                                    if(descriptor.get || descriptor.set){
                                        const thisDesc:PropertyDescriptor = js.getPropertyDescriptor(this, methodName);
                                        js.getset(this, originMethodName, descriptor.get.bind(this._root), descriptor.set.bind(this._root), descriptor.enumerable, descriptor.configurable);                                        
                                        js.getset(this._root, methodName, thisDesc.get ? thisDesc.get.bind(this) : descriptor.get.bind(this._root) , thisDesc.set ? thisDesc.set.bind(this):descriptor.set.bind(this._root), thisDesc.enumerable, thisDesc.configurable)
                                    }else{
                                        // Save previous inheritance method with name ['__super'+ methodName + '__']                                    
                                        this[originMethodName] = getSuperMethod(this, methodName);
                                        // Rewrite the origin super root method by this[methodName].
                                        this._root[methodName] = this[methodName].bind(this);
                                    }
                                }
                            })
                        }
                        // 
                        const defaultFuntion:Function = function(){};
                        // Define this.super with proxy
                        if(!this.super && this._root && this._super){                        
                            const superProxy = new Proxy(this._root, {
                                get: (target:any, prop:string) => {                                    
                                    if (Object.prototype.hasOwnProperty.call(target, prop)) {                                
                                        if (typeof target[prop] === 'function' ) {
                                            if(listOfOverrideMethods && listOfOverrideMethods.has(prop)){                                                    
                                                return this['__super'+ prop + '__'];
                                            }
                                            return target[prop].bind(target);
                                        } else {
                                            return target[prop];
                                        }
                                    }else{
                                        return defaultFuntion;
                                    }
                                },
                                set:(target:any, prop:string, value:any):boolean => {
                                    if (typeof target[prop] !== 'function' ) {
                                        if(listOfOverrideMethods && listOfOverrideMethods.has(prop)){                                                    
                                            this['__super'+ prop + '__'] = value;                                            
                                        }else{
                                            target[prop] = value
                                        }
                                        return true
                                    }
                                    return false
                                }
                            });
                            Object.defineProperty(this, 'super', {
                                get:()=>superProxy
                            })
                        }                            
                        break;
                    }else if(comp.enabled){                    
                        lastComponent = comp;
                    }
                    
                }// end for
            }

            return previousOnLoad ? previousOnLoad.call(this) : null;
        })(target['onLoad']);
        // 
        target['onDestroy'] = ((previousDestroy:Function)=>function(){
            previousDestroy ? previousDestroy.call(this) : null            
            this._super = null;
            this._root = null;               
        })(target['onDestroy'])
    }

}

@ccclass('ParasiteComponent')
export abstract class ParasiteComponent<SuperComponent=Component> extends Component {
    
    @property({
        displayName: 'Extends',        
        readonly:true
    })
    get superName():string{
        return this._superName
    }

    protected _root:Component = null;
    protected _super:SuperComponent = null;    
    protected _superName:string = null;
    protected super:SuperComponent&Component = null;

    // onLoad(){
    //     if(!this.enabled) return;
    //     if(!this.super){
    //         let listOfOverrideMethods:Set<string> = this[OVERRIDE_METHOD_MAP];   
    //         let lastComponent:Component;
    //         const comps:Component[] = this.node.getComponents(Component);
    //         for (let index = 0; index < comps.length; index++) {  
    //             const comp:any = comps[index];
    //             if(!comp) continue;
    //             if(lastComponent && comp === this){
    //                 if(lastComponent && lastComponent['_super']){
    //                     this._root = lastComponent['_root'] 
    //                 }else{
    //                     this._root = lastComponent
    //                 }
    //                 // log('______root :: ' + this._root.name);
    //                 this._super = lastComponent as SuperComponent&Component;
    //                 this._superName = js.getClassName(this._super) + ' <' + this._root['node']?.name + '>';
    //                 // Initianizing the inheritance instance with 'this.super' property
    //                 if(this._super && this._root){
    //                     // override all of methods has @override decorator tag.
    //                     listOfOverrideMethods.forEach((methodName:string)=>{
    //                         const originMethodName:string = '__super'+ methodName + '__';
    //                         const originSuperMethod:Function = this[originMethodName];
    //                         if(!originSuperMethod){
    //                             // Save previous inheritance method with name ['__super'+ methodName + '__']
    //                             // this[originMethodName] = superTarget[methodName].bind(this._super);
    //                             this[originMethodName] = this.getSuperMethod(this, methodName);
    //                             // Rewrite the origin super root method by this[methodName].
    //                             this._root[methodName] = this[methodName].bind(this);
    //                         }
    //                     })
    //                 }
    //                 // 
    //                 const defaultFuntion:Function = function(){};
    //                 // Define this.super with proxy
    //                 if(!this.super && this._root && this._super){                        
    //                     const superProxy = new Proxy(this._root, {
    //                         get: (target:any, prop:string) => {
    //                             // if (prop in target) {
    //                             if (Object.prototype.hasOwnProperty.call(target, prop)) {                                
    //                                 if (typeof target[prop] === 'function' ) {
    //                                     if(listOfOverrideMethods && listOfOverrideMethods.has(prop)){                                                    
    //                                         return this['__super'+ prop + '__'];
    //                                     }
    //                                     return target[prop].bind(target);
    //                                 } else {
    //                                     return target[prop];
    //                                 }
    //                             }else{
    //                                 return defaultFuntion
    //                             }
    //                         }
    //                     });
    //                     Object.defineProperty(this, 'super', {
    //                         get:()=>superProxy
    //                     })
    //                 }                            
    //                 break;
    //             }else if(comp.enabled){                    
    //                 lastComponent = comp;
    //             }
                
    //         }// end for
    //         // 
    //     }
    //     // 
    // }

    // /**
    //  * Get super method from inheritance chain.
    //  * @param target 
    //  */
    // private getSuperMethod(target:any, methodName:string):Function{
    //     if(!target._super || !target._root){
    //         return null
    //     }
    //     // In the case, this component is a first parasite component, we get function method from prototype of super.
    //     // In other case, these funtions would be get from the super instance.
    //     const superTarget:any = (target._super === target._root) ? Object.getPrototypeOf(target._super) : target._super;
    //     const superFuntion:Function = superTarget[methodName];
    //     if(superFuntion){
    //         return superFuntion.bind(target._super);
    //     }else{
    //         return this.getSuperMethod(target._super, methodName);
    //     }
    // }

}

