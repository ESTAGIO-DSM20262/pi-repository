import { ACCESSIBILITY_STORAGE_KEY } from './preferences'

export const ACCESSIBILITY_NO_FLASH_SCRIPT = `(function(){
var s=[100,110,125,150,175,200],c=['default','achromatomaly','achromatopsia','deuteranomaly','deuteranopia','protanomaly','protanopia','tritanomaly','tritanopia'];
var p={};
try{
  var raw=window.localStorage.getItem('${ACCESSIBILITY_STORAGE_KEY}');
  if(raw){
    try{
      var parsed=JSON.parse(raw);
      if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed)){p=parsed;}
    }catch(_){}
  }
}catch(_){}
var e=document.documentElement;
e.setAttribute('data-a11y-text',String(s.indexOf(p.textSize)>-1?p.textSize:100));
e.setAttribute('data-a11y-theme',p.theme==='dark'?'dark':'light');
e.setAttribute('data-a11y-contrast',p.highContrast===true?'high':'normal');
e.setAttribute('data-a11y-colors',c.indexOf(p.colorMode)>-1?p.colorMode:'default');
e.setAttribute('data-a11y-underline',p.underlineLinks===true?'on':'off');
e.setAttribute('data-a11y-motion',p.reduceMotion===true?'reduce':'normal');
e.setAttribute('data-a11y-focus',p.highlightFocus===true?'strong':'normal');
})();`
