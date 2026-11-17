"""Proof build: a tailored web cut of Instrument Sans (SIL OFL 1.1, no Reserved Font Name) for the ALAS site.

Input : the upstream variable font  InstrumentSans[wdth,wght].ttf  (Google Fonts / github.com/Instrument/instrument-sans)
Output: two static WOFF2 files that drop into the site's existing CSS unchanged (font-weight 400 and 700):
          - weight 400 file = wght 440 (matches ABC Diatype Regular's stem weight, measured from Dinamo's specimen)
          - weight 700 file = wght 600 (matches ABC Diatype Bold's stem weight)
        with the Helvetica-style alternates made default (ss05 R, ss08 J, ss09 Q, ss12 $ and cent; the default G already has the spur),
        U+2011 / U+2010 mapped to the hyphen, optional spacing baked in, subset to the Latin the site uses.
        Also writes one variable WOFF2 (wght 400-700) with the same patches, for comparison of size.

Usage: build_alas_cut.py <upstream.ttf> <out_dir> [--track -10] [--space 230]

OFL 1.1 allows modification and redistribution with the licence text; ship OFL.txt next to the files."""
import argparse
import copy
import os

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

FREEZE = ["ss05", "ss08", "ss09", "ss12"]   # R, J, Q, $ and cent. (ss07 would REMOVE the spur of G: leave it off)
KEEP_FEATURES = ["kern", "liga", "calt", "ccmp", "locl", "mark", "mkmk", "tnum", "pnum", "case", "ordn"]
# Basic Latin, Latin-1, Latin Extended-A, a few letters beyond, punctuation, currency, arrows, maths
UNICODES = (
    list(range(0x20, 0x7F)) + list(range(0xA0, 0x180)) + [0x192, 0x2C6, 0x2DA, 0x2DC]
    + list(range(0x2010, 0x2016)) + list(range(0x2018, 0x201F)) + [0x2020, 0x2021, 0x2022, 0x2026, 0x2030, 0x2032, 0x2033, 0x2039, 0x203A, 0x2044]
    + [0x20AC, 0x2116, 0x2122, 0x2190, 0x2191, 0x2192, 0x2193, 0x2196, 0x2197, 0x2198, 0x2199, 0x2212, 0x2215, 0x2219, 0x221E, 0x2248, 0x2260, 0x2264, 0x2265, 0x25CF, 0xFB01, 0xFB02]
)


def single_subs(font, tags):
    """glyph -> alternate for the single-substitution lookups of the given features."""
    gsub = font["GSUB"].table
    out = {}
    for fr in gsub.FeatureList.FeatureRecord:
        if fr.FeatureTag not in tags:
            continue
        for li in fr.Feature.LookupListIndex:
            lk = gsub.LookupList.Lookup[li]
            for st in lk.SubTable:
                if hasattr(st, "ExtSubTable"):
                    st = st.ExtSubTable
                m = getattr(st, "mapping", None)
                if m:
                    out.update(m)
    return out


def freeze(font, tags):
    subs = single_subs(font, tags)
    n = 0
    for table in font["cmap"].tables:
        for cp, g in list(table.cmap.items()):
            if g in subs:
                table.cmap[cp] = subs[g]
                n += 1
    return subs, n


def patch_cmap(font):
    for table in font["cmap"].tables:
        if not table.isUnicode():
            continue
        hy = table.cmap.get(0x2D)
        if hy:
            table.cmap.setdefault(0x2011, hy)   # non-breaking hyphen (used 4 times on the site)
            table.cmap.setdefault(0x2010, hy)   # hyphen
        sp = table.cmap.get(0x20)
        if sp:
            table.cmap.setdefault(0xA0, sp)


def respace(font, track, space):
    """Bake letter-spacing (units added to every advance, like CSS letter-spacing) and a new word space."""
    hmtx = font["hmtx"]
    cmap = font.getBestCmap()
    space_glyphs = {cmap.get(0x20), cmap.get(0xA0)} - {None}
    for g, (adv, lsb) in hmtx.metrics.items():
        if adv <= 0:
            continue
        if g in space_glyphs:
            hmtx.metrics[g] = (space, lsb)
        elif track:
            hmtx.metrics[g] = (adv + track, lsb)
    if "hhea" in font:
        font["hhea"].advanceWidthMax = max(a for a, _ in hmtx.metrics.values())


def pad_middot(font, pad):
    """Give the middle dot side bearings so ' · ' works as a separator (upstream draws it with none)."""
    g = font.getBestCmap().get(0xB7)
    if not pad or not g:
        return
    glyf = font["glyf"]
    gl = glyf[g]
    if gl.isComposite():
        for comp in gl.components:
            comp.x += pad
    elif gl.numberOfContours > 0:
        gl.coordinates.translate((pad, 0))
    gl.recalcBounds(glyf)
    adv, lsb = font["hmtx"].metrics[g]
    font["hmtx"].metrics[g] = (adv + 2 * pad, lsb + pad)


def rename(font, style, weight_class, note):
    name = font["name"]
    for rec in list(name.names):
        if rec.nameID == 5:
            name.setName(rec.toUnicode().split(";")[0] + "; " + note, 5, rec.platformID, rec.platEncID, rec.langID)
        if rec.nameID in (2, 17):
            name.setName(style, rec.nameID, rec.platformID, rec.platEncID, rec.langID)
    os2 = font["OS/2"]
    os2.usWeightClass = weight_class
    bold = weight_class >= 700
    os2.fsSelection = (os2.fsSelection & ~0b1100001) | (0b100000 if bold else 0b1000000) | (os2.fsSelection & 0b10000000)
    font["head"].macStyle = 1 if bold else 0


def do_subset(font, path):
    opts = subset.Options()
    opts.flavor = "woff2"
    opts.layout_features = KEEP_FEATURES
    opts.name_IDs = ["*"]
    opts.name_languages = ["*"]
    opts.notdef_outline = True
    opts.glyph_names = False
    opts.hinting = False
    opts.desubroutinize = True
    sub = subset.Subsetter(opts)
    present = set(font.getBestCmap())
    sub.populate(unicodes=[u for u in UNICODES if u in present])
    sub.subset(font)
    font.flavor = "woff2"
    font.save(path)
    return os.path.getsize(path)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("out")
    ap.add_argument("--track", type=int, default=-14, help="units (1/1000 em) added to every advance")
    ap.add_argument("--space", type=int, default=228, help="word-space advance in units")
    ap.add_argument("--middot-pad", type=int, default=60, help="units of side bearing added on each side of U+00B7")
    ap.add_argument("--regular", type=float, default=440)
    ap.add_argument("--bold", type=float, default=600)
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    note = f"ALAS web cut: alternates {' '.join(FREEZE)} default, U+2010/2011 mapped, tracking {a.track}, space {a.space}, middot pad {a.middot_pad}"

    results = {}
    for style, wght, cls, fname in (("Regular", a.regular, 400, "InstrumentSans-ALAS-Regular.woff2"), ("Bold", a.bold, 700, "InstrumentSans-ALAS-Bold.woff2")):
        vf = TTFont(a.src)
        subs, n = freeze(vf, FREEZE)
        st = instancer.instantiateVariableFont(vf, {"wght": wght, "wdth": 100}, inplace=False)
        patch_cmap(st)
        respace(st, a.track, a.space)
        pad_middot(st, a.middot_pad)
        rename(st, style, cls, note + f", wght {wght:g}")
        ttf_path = os.path.join(a.out, fname.replace(".woff2", ".ttf"))
        st.save(ttf_path)                      # full static TTF kept for proofing
        results[fname] = do_subset(TTFont(ttf_path), os.path.join(a.out, fname))
        print(f"{fname}: wght {wght:g} -> declared {cls}; {n} cmap entries re-pointed to alternates; {results[fname]} bytes")

    # variable alternative: wght 400-700 kept, width pinned, same patches, no weight remap, spacing baked too
    vf = TTFont(a.src)
    freeze(vf, FREEZE)
    v = instancer.instantiateVariableFont(vf, {"wdth": 100}, inplace=False)
    patch_cmap(v)
    # advances vary along wght (HVAR); shifting the default master's advances shifts every instance equally
    respace(v, a.track, a.space)
    pad_middot(v, a.middot_pad)
    name = "InstrumentSans-ALAS-Variable.woff2"
    results[name] = do_subset(v, os.path.join(a.out, name))
    print(f"{name}: wght 400-700; {results[name]} bytes")
    return results


if __name__ == "__main__":
    main()
