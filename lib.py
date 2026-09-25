# -*- coding: utf-8 -*-
"""ตัวช่วยสร้างฟอร์ม ใช้ร่วมกันระหว่าง build.py และ tools_more.py"""


def f(id, label, value="", *, type="number", hint="", attrs=""):
    """ช่องกรอกมาตรฐาน"""
    im = ' inputmode="decimal"' if type == "number" else ""
    h = f"<small>{hint}</small>" if hint else ""
    return (f'<label class="field"><span>{label}</span>'
            f'<input id="{id}" type="{type}"{im} value="{value}" {attrs}>{h}</label>')


def sel(id, label, options, selected=None, hint=""):
    """dropdown: options = [(value, text), ...]"""
    h = f"<small>{hint}</small>" if hint else ""
    opts = ''.join(f'<option value="{v}"{" selected" if str(v) == str(selected) else ""}>{t}</option>' for v, t in options)
    return f'<label class="field"><span>{label}</span><select id="{id}">{opts}</select>{h}</label>'


def grid(*items):
    return '<div class="grid2">' + ''.join(items) + '</div>'


def check(id, label, checked=False):
    return f'<label class="check"><input id="{id}" type="checkbox"{" checked" if checked else ""}> {label}</label>'


def result(id="result"):
    return f'<div class="result" id="{id}" aria-live="polite"></div>'
