import sys
from PIL import Image, ImageDraw, ImageFont, ImageChops
from fontTools.ttLib import TTFont
orig, baked, feats, text = sys.argv[1], sys.argv[2], [x for x in sys.argv[3].split(',') if x], sys.argv[4]
disable = [x for x in (sys.argv[5] if len(sys.argv)>5 else '').split(',') if x]
lang = sys.argv[6] if len(sys.argv)>6 else None
def render(path, features, direction=None):
    f = ImageFont.truetype(path, 64, layout_engine=ImageFont.Layout.RAQM)
    im = Image.new('L',(1400,120),255); d=ImageDraw.Draw(im)
    d.text((10,10), text, font=f, fill=0, features=features, direction=direction, language=lang)
    return im
feat_args = feats + ['-'+x for x in disable]
a = render(orig, feat_args); b = render(baked, []); c = render(orig, [])
print('baked==orig+features:', ImageChops.difference(a,b).getbbox() is None, '| orig(no features) differs from baked:', ImageChops.difference(c,b).getbbox() is not None)
# structural load
t=TTFont(baked); 
for tb in ('GSUB','GPOS'):
    if tb in t:
        x=t[tb].table; print(tb,'features',[fr.FeatureTag for fr in x.FeatureList.FeatureRecord], 'sorted', [fr.FeatureTag for fr in x.FeatureList.FeatureRecord]==sorted(fr.FeatureTag for fr in x.FeatureList.FeatureRecord))
t.save('/tmp/_resave.ttf')
print('fonttools loaded & saved OK')
