// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import ParasiteComponent, { override } from "../../core/ParasiteComponent";

const {ccclass, property, executeInEditMode} = cc._decorator;

@ccclass
@executeInEditMode
export default class RichTextSmartAsset extends ParasiteComponent<cc.RichText> {

    
    /**
     * 
     * @param richTextElement 
     * @returns 
     */
    @override
    _addRichTextImageElement (richTextElement:any) {
        let spriteFramePath:string = richTextElement.style.src;
        if(spriteFramePath){
            const spriteFrame:cc.SpriteFrame = this.getSpriteFrameFromCache(spriteFramePath);
            if(!spriteFrame){
                this.loadSpriteFrameFromBundles(spriteFramePath, this.bundleNames.slice());
                return;
            }
        }else{
            return;
        }       
        // 
        this.super['_addRichTextImageElement'](richTextElement)
    }

    /**
     * 
     */
    @override
    get imageAtlas():cc.SpriteAtlas{        
        return this._imageAtlas || {getSpriteFrame: this.getSpriteFrame.bind(this)} as cc.SpriteAtlas;
    }
    
    set imageAtlas(value:cc.SpriteAtlas){
        this._imageAtlas = value;
    }
    
    //  -------------------

    @property({
        serializable:true,
        visible:false
    })
    _imageAtlas:cc.SpriteAtlas = null;
    
    @property({
        type:[cc.String],
    })
    bundleNames:string[] = ['resources'];

    protected cachedNames:Map<string, string> = new Map();
    
    //  -------------------

    /**
     * 
     * @param spriteFramePath 
     * @returns 
     */
    getSpriteFrame(spriteFramePath:string):cc.SpriteFrame{
        return this.getSpriteFrameFromCache(spriteFramePath);
    }

    /**
     * 
     * @param spriteFramePath 
     * @returns 
     */
    protected getSpriteFrameFromCache(spriteFramePath:string, bundleName?:string,  spriteFrameName:string = spriteFramePath.match(/([^\/]*)\/*$/)[1] ):cc.SpriteFrame  {
        let key:string = this.cachedNames.get(spriteFramePath);
        if(!key){          
            let spriteFrame:cc.SpriteFrame;
            if(bundleName){
                const bundle:cc.AssetManager.Bundle = cc.assetManager.getBundle(bundleName);
                if(bundle){
                    const spInfo = bundle.getAssetInfo(spriteFramePath)
                }
                spriteFrame = bundle.get(spriteFramePath, cc.SpriteFrame) as cc.SpriteFrame;
            }else {
                spriteFrame = spriteFrame ||  cc.assetManager.assets.find((asset:cc.Asset, assetKey:string)=>{
                    const condition:boolean = asset.name == spriteFramePath && (asset instanceof cc.SpriteFrame);
                    if(condition){
                        key = assetKey;
                        this.cachedNames.set(spriteFramePath, assetKey);
                    }
                    return condition;
                }) as cc.SpriteFrame ;
            }
            // 
            if(!spriteFrame){
                // const spriteFrameName:string = spriteFramePath.match(/([^\/]*)\/*$/)[1];
                return spriteFrameName !== spriteFramePath ? this.getSpriteFrameFromCache(spriteFrameName, bundleName) : null;
            }
            return spriteFrame;
        }  
        return cc.assetManager.assets.get(key) as cc.SpriteFrame      
    }

    /**
     * 
     * @param bundleNames 
     */
    protected loadSpriteFrameFromBundles(spriteFramePath:string, bundleNames?:string[], continues:boolean = true){        
        if(bundleNames && bundleNames.length){
            // const bundleName:string = investBundleName ? investBundleName : this.bundleNames.shift();
            const bundleName:string = continues ? bundleNames.shift() : bundleNames[0];
            if(bundleName){
                const bundle:cc.AssetManager.Bundle = cc.assetManager.getBundle(bundleName);
                if(!bundle){
                    cc.assetManager.loadBundle(bundleName,(err:any,bundle:cc.AssetManager.Bundle)=>{
                        if(!err){
                            this.loadSpriteFrameFromBundles(spriteFramePath, bundleNames, false);
                        }else{
                            this.loadSpriteFrameFromBundles(spriteFramePath, bundleNames, true);
                        }
                    })
                    return;
                }
                // 
                // bundle.getInfoWithPath(spriteFramePath).key
                bundle.load(spriteFramePath, cc.SpriteFrame, (err:Error, asset:cc.SpriteFrame)=>{
                    if(!err){
                        cc.log('asset:: ' + asset ? asset.name : "null")  
                        
                        const spriteFrame:cc.SpriteFrame =  this.getSpriteFrameFromCache(spriteFramePath);
                        spriteFrame && this.super['_updateRichText']();                        
                    }else{
                        this.loadSpriteFrameFromBundles(spriteFramePath, bundleNames, true);
                    }
                })
            }
        }
    }

    // ----------------------------------------

    protected onDestroy(): void {
        

    }

    
}
