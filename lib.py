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


def chart_block(table=True, table_title="ดูตารางรายปี"):
    """ผลลัพธ์ + กราฟ + ตาราง (เปิดดูได้) + ปุ่มแชร์ลิงก์"""
    t = (f'<details class="tbl-details"><summary>{table_title}</summary><div id="table"></div></details>' if table else '')
    return (result() + '<div id="chart" class="chart-box"></div>' + t +
            '<div class="share-row"><button type="button" class="btn ghost" data-share>'
            '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" '
            'stroke-linecap="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/>'
            '<circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>แชร์ผลลัพธ์นี้</button>'
            '<span class="note">ลิงก์จะเก็บตัวเลขที่กรอกไว้ เปิดแล้วเห็นผลเดียวกัน</span></div>')
