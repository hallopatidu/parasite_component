// Author by dzung@gamifystudios.co
import ParasiteComponent, { override } from "../../core/ParasiteComponent";

const {ccclass, property, executeInEditMode} = cc._decorator;

const EMBED:string = '$embed';
const SEPERATE:string = '::';
const DEFAULT_BUNDLES:string[] = ['resources'];
/**
 * Support searching and finding spriteframe from embed assets or assets located inside the specify bundle.  
 * Note:
 * - When the 'imageAtlas' attribute of RichText component is setted, RichTextSmartAsset just find only spriteframe inside this atlas.
 * - DO NOT support show off images inside RichText Component on Editor. This feature will be coded in the furture.
 */
@ccclass
@executeInEditMode
export default class RichTextSmartAsset extends ParasiteComponent<cc.RichText> {

    /**
     * Runtime override _addRichTextImageElement method of native RichText Component.
     * @param richTextElement 
     * @returns 
     */
    @override
    _addRichTextImageElement (richTextElement:any) {
        if(this.enabled){
            // These line just prevent the warning from RichText Componet when we are in the asset loading proccess.
            let spriteFramePath:string = richTextElement.style.src;
            if(spriteFramePath){
                let hasSpriteFrame:boolean = this.hasSpriteFrameFromCache(spriteFramePath);
                if(!hasSpriteFrame && !this.getOrLoadSpriteFrame(spriteFramePath)){                    
                    return;
                }
            }else{
                return;
            }     
        }
        // 
        this.super['_addRichTextImageElement'](richTextElement);
    }

    /**
     * At Runtime, this method override _needsUpdateTextLayout method of native RichText Component.
     * @param newTextArray 
     * @returns 
     */
    @override
    _needsUpdateTextLayout (newTextArray:any[]) {
        return this._forceUpdate || this.super['_needsUpdateTextLayout'](newTextArray)
    }

    /**
     * In the case, imageAtlas attribute of RichText Component is not setted, 
     * return a fake SpriteAtlas Object which has the 'getSpriteFrame' method modified for the spriteframe lazy loading.
     */
    @override
    get imageAtlas():cc.SpriteAtlas{        
        return this._imageAtlas || {getSpriteFrame: this.getOrLoadSpriteFrame.bind(this)} as cc.SpriteAtlas;
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
    get bundleNames():string[]{
        return this._bundleNames
    }

    set bundleNames(value:string[]){
        this._bundleNames = value;
    }

    
    private _bundleNames:string[] = DEFAULT_BUNDLES.slice();

    private _forceUpdate:boolean = false;

    protected cachedNames:Map<string, string> = new Map();  // Map<path, uuid>

    
    
    //  -------------------

    /**
     * This method only active when the imageAtlas is not setted.
     * When the spriteFrame asset is embed in this scene. this method will return this spriteframe first.
     * @param spriteFramePath 
     * @returns 
     */
    getOrLoadSpriteFrame(spriteFramePath:string):cc.SpriteFrame{   
        const spriteFrame:cc.SpriteFrame = this.getSpriteFrameFromEmbedAssets(spriteFramePath) || this.getSpriteFrameFromBundle(spriteFramePath);
        return spriteFrame
    }

    /**
     * Is there the spritefame in caches or not ?
     * @param spriteFramePath 
     * @returns 
     */
    protected hasSpriteFrameFromCache(spriteFramePath:string):boolean {
        return this.cachedNames.has(spriteFramePath);
    }

    // --------------------------------
    /**
     * Find the spriteFrame asset inside the embed assets.
     * Finding for full path first after that if the result is null, would continue finding by the file name.
     * @param spriteFramePath 
     */
    protected getSpriteFrameFromEmbedAssets(spriteFramePath:string, spriteFrameName:string = spriteFramePath.match(/([^\/]*)\/*$/)[1]):cc.SpriteFrame{
        let spriteFrame:cc.SpriteFrame;
        let key:string = this.cachedNames.get(spriteFramePath);
        if(!key){
             cc.assetManager.assets.find((asset:cc.Asset, assetKey:string)=>{
                const condition:boolean = asset.name == spriteFramePath && (asset instanceof cc.SpriteFrame);
                if(condition){       
                    key = EMBED + SEPERATE + assetKey
                    this.cachedNames.set(spriteFramePath, key);                    
                }
                return condition;
            }) as cc.SpriteFrame ;
        }
        spriteFrame = key ? cc.assetManager.assets.get( key.split(SEPERATE)[1] ) as cc.SpriteFrame : null;
        if(!spriteFrame){
            return spriteFrameName !== spriteFramePath ? this.getSpriteFrameFromEmbedAssets(spriteFrameName) : null;
        }
        return spriteFrame
    }

    /**
     * Find the spriteFrame asset inside the bundles.
     * Finding for full path first after that if the result is null, would continue finding by the file name.
     * @param spriteFramePath 
     * @param spriteFrameName 
     * @returns 
     */
    protected getSpriteFrameFromBundle(spriteFramePath:string, spriteFrameName:string = spriteFramePath.match(/([^\/]*)\/*$/)[1]):cc.SpriteFrame{
        let spriteFrame:cc.SpriteFrame;
        let key:string = this.cachedNames.get(spriteFramePath);
        if(!key){
            key = this.importSpriteFrameFromBundles(spriteFramePath, this.bundleNames.slice());            
        }
        if(key){            
            const bundleName:string = key.split(SEPERATE)[0];
            spriteFrame = cc.assetManager.getBundle(bundleName).get(spriteFramePath, cc.SpriteFrame) as cc.SpriteFrame;            
            if(!spriteFrame){
                return spriteFrameName !== spriteFramePath ? this.getSpriteFrameFromBundle(spriteFrameName) : null;
            }
        }        
        return spriteFrame
    }

    // -------------------------

    /**
     * In the case, the spriteFrame is not found in embed assets, we find it inside the bundle which has name is listed in 'this.bundleNames' attributes.
     * 
     * @param bundleNames 
     */
    protected importSpriteFrameFromBundles(spriteFramePath:string, bundleNames?:string[], lastBundleName?:string):string{        
        if((bundleNames && bundleNames.length) || lastBundleName){
            // const bundleName:string = investBundleName ? investBundleName : this.bundleNames.shift();
            const bundleName:string = lastBundleName ? lastBundleName : bundleNames.shift();
            if(bundleName){
                const bundle:cc.AssetManager.Bundle = cc.assetManager.getBundle(bundleName);
                if(!bundle){
                    // In case the bundle is not loaded.
                    cc.assetManager.loadBundle(bundleName, (err:any, bundle:cc.AssetManager.Bundle)=>{
                        if(!err && bundle){
                            bundle.load(spriteFramePath, cc.SpriteFrame, (err:Error, asset:cc.SpriteFrame)=>{
                                if(!err && asset){
                                    // Recall 'importSpriteFrameFromBundles' method for updating and refreshing RichText Component.
                                    this.importSpriteFrameFromBundles(spriteFramePath, bundleNames, bundleName);
                                    return null;                                                         
                                }
                                // Continue finding other bundles.
                                this.importSpriteFrameFromBundles(spriteFramePath, bundleNames);                    
                            })
                        }else{
                            // Continue finding other bundles.
                            this.importSpriteFrameFromBundles(spriteFramePath, bundleNames);
                        }
                    })
                    return null;
                }
                // 
                const spriteFrame:cc.SpriteFrame = bundle.get(spriteFramePath, cc.SpriteFrame) as cc.SpriteFrame;                
                if(spriteFrame){
                    // In the case, There is the spriteFrame inside this bundle.
                    const assetInfo:any = bundle.getInfoWithPath(spriteFramePath, cc.SpriteFrame);
                    if(!this.cachedNames.has(spriteFramePath) ){
                        this.cachedNames.set(spriteFramePath, bundle.name + SEPERATE + assetInfo.uuid);
                    }
                    return bundle.name + SEPERATE + assetInfo.uuid
                }else{
                    // In the case, bundle is loaded but the spriteFrame asset is not loaded.
                    bundle.load(spriteFramePath, cc.SpriteFrame, (err:Error, asset:cc.Asset)=>{
                        if(!err && asset){
                            const key:string = this.importSpriteFrameFromBundles(spriteFramePath, bundleNames, bundleName);
                            // Refresh RichText to implement the new asset with forceUpdate = true;
                            this._forceUpdate = true;
                            key && this.super['_updateRichTextStatus']();
                            this._forceUpdate = false;
                        }                        
                    })
                    return null;
                }
            }
        }
    }

    
    
}
