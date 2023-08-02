import { _decorator, Asset, AssetManager, assetManager, CCString, Component, error, Node, RichText, SpriteAtlas, SpriteFrame } from 'cc';
import ParasiteComponent, { override } from "../../core/ParasiteComponent";
const { ccclass, property, executeInEditMode } = _decorator;

const EMBED:string = '$embed';
const SEPERATE:string = '::';
const DEFAULT_BUNDLES:string[] = ['resources'];

@ccclass('RichTextSmartAsset')
@executeInEditMode(true)
export class RichTextSmartAsset extends ParasiteComponent<RichText> {
    
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
    get _imageAtlas():SpriteAtlas{
        // return this.super ? this.super['_imageAtlas'] || {getSpriteFrame: this.getOrLoadSpriteFrame.bind(this)} as SpriteAtlas : null
        return this['imageAtlas'] || {getSpriteFrame: this.getOrLoadSpriteFrame.bind(this)} as SpriteAtlas;
    };
    
    set _imageAtlas(value:SpriteAtlas){
        // if(this.super) this.super['_imageAtlas'] = value
        this['imageAtlas'] = value
    }

    // protected imageAtlas:SpriteAtlas = null;
    // ----------------------------------------------
    @property({
        type:[CCString],
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

    // ----------------------------------------------
    protected onLoad(): void {
        // if(!this.super['_imageAtlas']){
        //     this.super['_imageAtlas'] = {getSpriteFrame: this.getOrLoadSpriteFrame.bind(this)} as SpriteAtlas;
        // }
        
    }

    // ----------------------------------------------

    /**
     * This method only active when the imageAtlas is not setted.
     * When the spriteFrame asset is embed in this scene. this method will return this spriteframe first.
     * @param spriteFramePath 
     * @returns 
     */
    getOrLoadSpriteFrame(spriteFramePath:string):SpriteFrame{   
        const spriteFrame:SpriteFrame = this.getSpriteFrameFromEmbedAssets(spriteFramePath) || this.getSpriteFrameFromBundle(spriteFramePath);
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
    protected getSpriteFrameFromEmbedAssets(spriteFramePath:string, spriteFrameName:string = spriteFramePath.match(/([^\/]*)\/*$/)[1]):SpriteFrame{
        let spriteFrame:SpriteFrame;
        let key:string = this.cachedNames.get(spriteFramePath);
        if(!key){
            assetManager.assets.find((asset:Asset, assetKey:string)=>{
                const condition:boolean = asset.name == spriteFramePath && (asset instanceof SpriteFrame);
                if(condition){       
                    key = EMBED + SEPERATE + assetKey
                    this.cachedNames.set(spriteFramePath, key);                    
                }
                return condition;
            }) as SpriteFrame ;
        }
        spriteFrame = key ? assetManager.assets.get( key.split(SEPERATE)[1] ) as SpriteFrame : null;
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
    protected getSpriteFrameFromBundle(spriteFramePath:string, spriteFrameName:string = spriteFramePath.match(/([^\/]*)\/*$/)[1]):SpriteFrame{
        let spriteFrame:SpriteFrame;
        let key:string = this.cachedNames.get(spriteFramePath);
        if(!key){
            key = this.importSpriteFrameFromBundles(spriteFramePath, this.bundleNames.slice());            
        }
        if(key){            
            const bundleName:string = key.split(SEPERATE)[0];
            spriteFrame = assetManager.getBundle(bundleName).get(spriteFramePath, SpriteFrame) as SpriteFrame;            
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
                const bundle:AssetManager.Bundle = assetManager.getBundle(bundleName);
                if(!bundle){
                    // In case the bundle is not loaded.
                    assetManager.loadBundle(bundleName, (err:any, bundle:AssetManager.Bundle)=>{
                        if(!err && bundle){
                            bundle.load(spriteFramePath, SpriteFrame, (err:Error, asset:SpriteFrame)=>{
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
                const spriteFrame:SpriteFrame = bundle.get(spriteFramePath, SpriteFrame) as SpriteFrame;                
                if(spriteFrame){
                    // In the case, There is the spriteFrame inside this bundle.
                    const assetInfo:any = bundle.getInfoWithPath(spriteFramePath, SpriteFrame);
                    if(!this.cachedNames.has(spriteFramePath) ){
                        this.cachedNames.set(spriteFramePath, bundle.name + SEPERATE + assetInfo.uuid);
                    }
                    return bundle.name + SEPERATE + assetInfo.uuid
                }else{
                    // In the case, bundle is loaded but the spriteFrame asset is not loaded.
                    bundle.load(spriteFramePath, SpriteFrame, (err:Error, asset:Asset)=>{
                        if(!err && asset){
                            const key:string = this.importSpriteFrameFromBundles(spriteFramePath, bundleNames, bundleName);
                            // Refresh RichText to implement the new asset with forceUpdate = true;
                            this._forceUpdate = true;
                            key && this.super['_updateRichTextStatus']();
                            this._forceUpdate = false;
                        }else{
                            error('Load asset error : ' + err)
                        }
                    })
                    return null;
                }
            }
        }
    }
}

