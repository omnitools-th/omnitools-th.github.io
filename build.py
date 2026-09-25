# -*- coding: utf-8 -*-
"""สร้างเว็บ "วงไม่เงียบ" (เกมวงเหล้า/ปาร์ตี้บนมือถือ) เป็นไฟล์ HTML ธรรมดาใน docs/

วิธีใช้:  python build.py
"""
import hashlib
import html
import json
import shutil
from datetime import date
from pathlib import Path

# ============================== CONFIG ==============================
SITE_NAME = "วงไม่เงียบ"
SITE_TAGLINE = "รวมเกมวงเหล้า เกมปาร์ตี้ เล่นบนมือถือเครื่องเดียว"
SITE_URL = "https://omnitools-th.github.io/wongmaingiap"   # ไม่มี / ปิดท้าย
ADSENSE_CLIENT = ""
GOOGLE_VERIFY = ""
# ====================================================================

ROOT = Path(__file__).parent
OUT = ROOT / "docs"
TODAY = date.today().isoformat()
BE = date.today().year + 543

LOGO = ('<svg viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="lg" x1="0" x2="1" y1="0" y2="1">'
        '<stop offset="0" stop-color="#ff4d8d"/><stop offset="1" stop-color="#35d0ff"/></linearGradient></defs>'
        '<rect x="2" y="2" width="28" height="28" rx="9" fill="url(#lg)"/>'
        '<path d="M10 9h12l-1.5 12a4.5 4.5 0 0 1-9 0z" fill="#0f0c1b"/><path d="M11.2 14h9.6" stroke="#ffd23f" stroke-width="2"/>'
        '<circle cx="23.5" cy="8" r="1.6" fill="#fff"/><circle cx="8.5" cy="12" r="1.1" fill="#fff"/></svg>')
FAVICON = "data:image/svg+xml," + LOGO.replace('"', "'").replace('#', '%23').replace('<svg ', "<svg xmlns='http://www.w3.org/2000/svg' ")

PLAYERS = ('<details class="panel"><summary>👥 ผู้เล่น (<span id="playerCount"></span>) – ใส่ชื่อเพื่อให้บอกว่าถึงตาใคร</summary>'
           '<div class="players-add"><input id="playerName" placeholder="ชื่อเพื่อน (ใส่หลายชื่อคั่นด้วย ,)" autocomplete="off">'
           '<button class="btn alt" id="addPlayer" type="button">เพิ่ม</button></div><div class="chips" id="players"></div>'
           '<p class="note">ใส่ตามลำดับที่นั่งวนรอบวง ชื่อจะถูกจำไว้ในมือถือเครื่องนี้ ใช้ได้ทุกเกม</p></details>')

BOTTLE = ('<svg id="bottle" viewBox="0 0 60 200" aria-hidden="true"><defs><linearGradient id="bg" x1="0" x2="1">'
          '<stop offset="0" stop-color="#0b5d3b"/><stop offset=".45" stop-color="#27b57a"/><stop offset="1" stop-color="#0a4a2f"/></linearGradient></defs>'
          '<rect x="22" y="2" width="16" height="10" rx="3" fill="#ffd23f"/><path d="M23 12h14v40c0 8 17 18 17 34v100a12 12 0 0 1-12 12H18A12 12 0 0 1 6 186V86c0-16 17-26 17-34z" fill="url(#bg)"/>'
          '<rect x="10" y="110" width="40" height="46" rx="6" fill="#f5f2ff" opacity=".9"/><path d="M16 126h28M16 136h20" stroke="#ff4d8d" stroke-width="4" stroke-linecap="round"/>'
          '<path d="M14 90v88" stroke="#fff" stroke-opacity=".35" stroke-width="4" stroke-linecap="round"/></svg>')

# ------------------------------------------------------------------ เกม
GAMES = [
    dict(
        slug="card-game", vibes=True, vibe_note="เกมนี้ใช้กติกาเดิมทุกสาย แต่ถ้าเลือกสายกิน จำนวนจิบจะเพิ่มเป็น 2 เท่า", game="cards", icon="🃏", badge="ยอดนิยม", players=True,
        name="ไพ่วงเหล้า", card="เปิดไพ่ทีละใบ แต่ละใบมีกติกา แก้กติกาเองได้",
        title="เกมไพ่วงเหล้า กติกาไพ่แต่ละใบ เล่นบนมือถือไม่ต้องมีไพ่จริง",
        desc="เกมไพ่วงเหล้าบนมือถือ เปิดไพ่ทีละใบพร้อมกติกา A ถึง K ครบ ไม่ต้องพกไพ่จริง แก้ไขกติกาเองได้ มีโหมดไม่ดื่มสำหรับเล่นกับทุกคน",
        h1="ไพ่วงเหล้า", lead="วางมือถือไว้กลางวง ผลัดกันแตะเปิดไพ่ทีละใบ แล้วทำตามกติกาของไพ่ใบนั้น",
        stage='<div class="stage"><div class="turn" id="turn"></div><button class="playcard" id="card" type="button"></button>'
              '<div class="rule" id="rule" aria-live="polite"></div><div class="meta"><span id="left"></span><span id="kings"></span></div>'
              '<div class="row"><button class="btn big" id="draw" type="button">เปิดใบต่อไป</button><button class="btn ghost" id="reset" type="button">สับไพ่ใหม่</button></div></div>'
              '<details class="panel"><summary>✏️ แก้ไขกติกาไพ่แต่ละใบ</summary><div id="ruleEdit"></div>'
              '<p class="note">ใส่ <code>{pen1}</code> ตรงที่ต้องการให้แสดงบทลงโทษ ระบบจะเปลี่ยนเป็น “ดื่ม 1 จิบ” หรือภารกิจตามโหมดให้เอง</p>'
              '<button class="btn ghost" id="ruleReset" type="button">คืนค่ากติกาเริ่มต้น</button></details>',
        how="""<h2>กติกาไพ่วงเหล้า (ค่าเริ่มต้น)</h2>
<ul>
<li><b>A</b> ดื่มเอง · <b>2</b> ชี้เพื่อนให้ดื่ม · <b>3</b> คนทางซ้ายดื่ม · <b>4</b> คนทางขวาดื่ม · <b>5</b> ทุกคนดื่ม</li>
<li><b>6</b> จับหน้าผาก คนสุดท้ายดื่ม · <b>7</b> เจ็ดทะลุ นับเลขห้ามพูด 7 · <b>8</b> เพื่อนตาย เลือกคู่หูดื่มด้วยกัน</li>
<li><b>9</b> หมวดหมู่ พูดวนรอบวง · <b>10</b> ตั้งคำต้องห้าม · <b>J</b> ตั้งกฎใหม่ · <b>Q</b> ราชินีคำถาม ใครตอบคำถามต้องดื่ม</li>
<li><b>K</b> เทใส่แก้วกลาง คนที่เปิด K ใบที่ 4 ต้องจัดการแก้วกลาง</li>
</ul>
<p>แต่ละวงมีกติกาไม่เหมือนกัน กด “แก้ไขกติกาไพ่แต่ละใบ” เพื่อเปลี่ยนเป็นกติกาของวงคุณ ระบบจะจำไว้ในมือถือเครื่องนี้</p>""",
        faq=[("ต้องใช้ไพ่จริงไหม?", "ไม่ต้อง ระบบสับไพ่ 52 ใบให้แบบสุ่มจริง ไม่มีใบซ้ำจนกว่าจะหมดสำรับ"),
             ("เล่นกี่คนดี?", "สนุกที่สุดที่ 4–10 คน นั่งเป็นวงกลมและวางมือถือไว้ตรงกลาง"),
             ("ไม่อยากดื่มเล่นได้ไหม?", "ได้ กดปุ่ม “ไม่ดื่ม” มุมขวาบน บทลงโทษจะเปลี่ยนเป็นภารกิจตลกๆ แทน")],
    ),
    dict(
        slug="truth-or-dare", vibes=True, game="truth-dare", icon="😈", badge="ยอดนิยม", players=True,
        name="จริงหรือกล้า", card="คำถามจริงใจ 45+ ข้อ ภารกิจกล้า 40+ ข้อ",
        title="เกมจริงหรือกล้า (Truth or Dare) ภาษาไทย คำถามเยอะ เล่นในวงเหล้า",
        desc="เกมจริงหรือกล้า Truth or Dare ภาษาไทย สุ่มคำถามจริงและภารกิจกล้าไม่ซ้ำ เล่นบนมือถือในวงเหล้า ปาร์ตี้ หรือกับแฟน ไม่ตอบต้องโดนลงโทษ",
        h1="จริงหรือกล้า", lead="ถึงตาใคร ให้คนนั้นเลือก “จริง” เพื่อตอบคำถามตามจริง หรือ “กล้า” เพื่อทำภารกิจ ถ้าไม่ยอมต้องโดนลงโทษ",
        stage='<div class="stage"><div class="turn" id="turn"></div><div class="qcard" id="qcard" aria-live="polite"><p class="q dim">เลือก “จริง” หรือ “กล้า”</p></div>'
              '<div class="row"><button class="btn alt big" id="truth" type="button">จริง</button><button class="btn big" id="dare" type="button">กล้า</button></div>'
              '<div class="row"><button class="btn ghost" id="rnd" type="button">🎲 สุ่มให้</button><button class="btn ghost" id="next" type="button">คนถัดไป →</button></div></div>',
        how="""<h2>วิธีเล่นจริงหรือกล้า</h2>
<ol><li>ใส่ชื่อผู้เล่นตามลำดับที่นั่ง (ไม่บังคับ)</li><li>คนที่ถึงตาเลือก “จริง” หรือ “กล้า” หรือกดสุ่มให้</li>
<li>ตอบคำถามตามความจริง หรือทำภารกิจให้สำเร็จ ถ้าไม่ยอมทำต้องโดนบทลงโทษ</li><li>กด “คนถัดไป” เพื่อส่งตาให้คนต่อไป</li></ol>
<p>คำถามและภารกิจจะไม่ซ้ำจนกว่าจะเล่นครบทุกข้อ ภารกิจทุกข้อออกแบบให้ทำได้ในวงโดยไม่อันตราย ถ้าข้อไหนมีคนในวงไม่สะดวกใจ ข้ามได้เสมอ</p>""",
        faq=[("คำถามแรงไหม?", "เป็นระดับสนุกในวงเพื่อน ไม่หยาบคาย เหมาะทั้งวงเพื่อนและปาร์ตี้ทั่วไป"),
             ("เล่นสองคนกับแฟนได้ไหม?", "ได้ ผลัดกันเลือก จริง หรือ กล้า ได้เลย"),
             ("คำถามซ้ำไหม?", "ไม่ซ้ำจนกว่าจะเล่นครบทุกข้อ แล้วระบบจะสับใหม่")],
    ),
    dict(
        slug="spin-the-bottle", vibes=True, vibe_note="เกมนี้ใช้กติกาเดิมทุกสาย แต่ถ้าเลือกสายกิน จำนวนจิบจะเพิ่มเป็น 2 เท่า", game="bottle", icon="🍾", badge="ยอดนิยม",
        name="หมุนขวด", card="วางมือถือกลางวง แตะเพื่อหมุน ปากขวดชี้ใครคนนั้นโดน",
        title="เกมหมุนขวดออนไลน์ บนมือถือ วางกลางวงแล้วหมุน",
        desc="เกมหมุนขวดบนมือถือ วางโทรศัพท์ไว้กลางวงแล้วแตะหมุน ปากขวดชี้ใครคนนั้นต้องดื่มหรือเล่นจริงหรือกล้า มีเสียงและการสั่น ไม่ต้องใช้ขวดจริง",
        h1="หมุนขวด", lead="วางมือถือราบไว้กลางวง แตะที่ขวดเพื่อหมุน ปากขวด (ฝาสีเหลือง) ชี้ไปที่ใคร คนนั้นโดน",
        stage=f'<div class="stage"><div class="bottle-wrap" id="bottleWrap">{BOTTLE}</div>'
              '<div class="result" id="result" aria-live="polite">&nbsp;</div><button class="btn big" id="spin" type="button">หมุนขวด</button></div>',
        how="""<h2>วิธีเล่นหมุนขวด</h2>
<p>ให้ทุกคนนั่งล้อมเป็นวงกลม วางมือถือราบไว้ตรงกลาง แล้วแตะที่ขวดหรือกดปุ่มหมุน ขวดจะหมุนด้วยความแรงแบบสุ่มทุกครั้ง ปากขวดหยุดชี้ไปทางไหน คนนั้นต้องดื่มหรือเลือกเล่นจริงหรือกล้า</p>
<p>ตั้งกติกาเพิ่มได้ เช่น คนที่ถูกชี้ต้องตอบคำถามจากคนที่หมุน หรือถ้าก้นขวดชี้ใคร คนนั้นเป็นคนตั้งคำถาม</p>""",
        faq=[("ขวดหมุนสุ่มจริงไหม?", "จริง ใช้ตัวสุ่มของเบราว์เซอร์ ไม่ได้ขึ้นกับแรงที่แตะ ทุกทิศมีโอกาสเท่ากัน"),
             ("จอดับระหว่างเล่นไหม?", "ระบบจะขอให้หน้าจอเปิดค้างไว้ระหว่างเล่น (บนเบราว์เซอร์ที่รองรับ)")],
    ),
    dict(
        slug="number-bomb", game="number-bomb", icon="💣", badge="ยอดนิยม", players=True,
        name="เลขระเบิด", card="ทายเลข 1–100 ช่วงแคบลงเรื่อยๆ ใครทายโดนระเบิดโดน",
        title="เกมเลขระเบิด ทายเลข 1-100 เกมวงเหล้ายอดฮิต บนมือถือ",
        desc="เกมเลขระเบิดบนมือถือ ระบบสุ่มเลขลับ 1-100 ผลัดกันทาย ช่วงตัวเลขแคบลงเรื่อยๆ ใครทายโดนเลขระเบิดต้องดื่ม ไม่ต้องมีคนคุมเกม",
        h1="เลขระเบิด", lead="ระบบซ่อนเลขระเบิดไว้ 1 ตัว ผลัดกันทาย ถ้าไม่โดน ช่วงตัวเลขจะแคบลง ใครทายโดนเลขระเบิด คนนั้นโดน!",
        stage='<div class="stage" id="stage"><div class="turn" id="turn"></div><div class="range" id="range" aria-live="polite"></div>'
              '<div class="guess" id="guess">—</div><div class="pad" id="pad">'
              + ''.join(f'<button type="button" data-k="{k}">{k}</button>' for k in range(1, 10))
              + '<button type="button" data-k="del" aria-label="ลบ">⌫</button><button type="button" data-k="0">0</button>'
              '<button type="button" data-k="ok" class="ok">ทาย</button></div><div class="log" id="log"></div>'
              '<div class="opts"><label class="field"><span>ช่วงตัวเลข</span><select id="max"><option value="100">1 – 100</option>'
              '<option value="50">1 – 50 (เร็ว)</option><option value="500">1 – 500</option><option value="1000">1 – 1000</option></select></label>'
              '<button class="btn ghost" id="reset" type="button">เริ่มรอบใหม่</button></div></div>',
        how="""<h2>วิธีเล่นเลขระเบิด</h2>
<p>เดิมทีต้องมีคนคุมเกมที่รู้เลขลับ แต่ในหน้านี้ระบบเป็นคนคุมให้ ทุกคนจึงได้เล่นด้วย</p>
<ol><li>ส่งมือถือวนรอบวง แต่ละคนพิมพ์เลขที่อยู่ในช่วงที่แสดงแล้วกด “ทาย”</li>
<li>ถ้าไม่ใช่เลขระเบิด ช่วงตัวเลขจะแคบลง เช่น เลขลับคือ 42 ถ้าทาย 60 ช่วงจะเหลือ 1 – 59</li>
<li>ใครทายโดนเลขระเบิด จะมีเสียงระเบิดและจอเปลี่ยนเป็นสีแดง คนนั้นโดนลงโทษ</li></ol>""",
        faq=[("ทายเลขนอกช่วงได้ไหม?", "ไม่ได้ ระบบจะสั่นเตือนและให้ทายใหม่"),
             ("เลขลับสุ่มใหม่ทุกรอบไหม?", "ใช่ สุ่มใหม่ทุกครั้งที่กดเริ่มรอบใหม่หรือเปลี่ยนช่วงตัวเลข")],
    ),
    dict(
        slug="time-bomb", game="bomb", icon="⏱️",
        name="ระเบิดเวลา", card="ตอบคำถามแล้วส่งมือถือต่อ ระเบิดในมือใคร คนนั้นโดน",
        title="เกมระเบิดเวลา ส่งต่อมือถือ ระเบิดในมือใครคนนั้นดื่ม",
        desc="เกมระเบิดเวลาบนมือถือ ตอบคำถามให้ทันแล้วส่งโทรศัพท์ให้คนถัดไป ไม่มีใครรู้ว่าจะระเบิดเมื่อไหร่ เสียงติ๊กเร็วขึ้นเรื่อยๆ ระเบิดในมือใครคนนั้นโดน",
        h1="ระเบิดเวลา", lead="กดเริ่ม แล้วตอบคำถามบนจอให้ได้ กด “ส่งต่อ!” แล้วยื่นมือถือให้คนถัดไป ระเบิดจะดังเมื่อไหร่ไม่มีใครรู้",
        stage='<div class="stage" id="stage"><div class="topic" id="topic" aria-live="polite"></div>'
              '<button class="bomb-btn" id="bombBtn" type="button">เริ่ม</button><div class="result" id="status" aria-live="polite">&nbsp;</div>'
              '<div class="opts"><label class="field"><span>เวลาก่อนระเบิด</span><select id="len"><option value="short">สั้น (10–25 วิ)</option>'
              '<option value="mid" selected>กลาง (20–45 วิ)</option><option value="long">ยาว (40–90 วิ)</option></select></label>'
              '<label class="check"><input type="checkbox" id="useTopic" checked> มีคำถามให้ตอบก่อนส่งต่อ</label></div></div>',
        how="""<h2>วิธีเล่นระเบิดเวลา</h2>
<ol><li>เลือกความยาวเวลา แล้วกด “เริ่ม”</li><li>คนที่ถือมือถือต้องตอบคำถามบนจอ เช่น “พูดชื่อผลไม้ 1 อย่าง” ห้ามซ้ำกับที่คนอื่นพูดไปแล้ว</li>
<li>ตอบเสร็จกด “ส่งต่อ!” แล้วยื่นมือถือให้คนถัดไปทันที</li><li>เสียงติ๊กจะเร็วขึ้นเรื่อยๆ ระเบิดในมือใคร คนนั้นโดน</li></ol>""",
        faq=[("รู้ได้ไหมว่าจะระเบิดตอนไหน?", "ไม่ได้ เวลาสุ่มทุกรอบ เสียงติ๊กเร็วขึ้นเพื่อเพิ่มความกดดันเท่านั้น"),
             ("ปิดคำถามได้ไหม?", "ได้ เอาติ๊กออกแล้วเล่นแบบส่งต่อเร็วที่สุดอย่างเดียว")],
    ),
    dict(
        slug="finger-chooser", game="finger", icon="👆", badge="ใหม่",
        name="วางนิ้วสุ่มคน", card="ทุกคนวางนิ้วบนจอพร้อมกัน ระบบเลือกผู้โชคร้าย",
        title="วางนิ้วสุ่มคน บนจอมือถือ เลือกคนดื่ม เลือกคนจ่าย",
        desc="สุ่มเลือกคนด้วยการวางนิ้วบนจอมือถือพร้อมกัน ระบบเลือกผู้โชคร้าย 1 คนหรือมากกว่า ใช้เลือกคนดื่ม คนจ่ายเงิน คนเริ่มเกม ยุติธรรม ไม่มีใครโกงได้",
        h1="วางนิ้วสุ่มคน", lead="ให้ทุกคนวางนิ้วบนจอพร้อมกันแล้วค้างไว้ 2 วินาที ระบบจะเลือกผู้โชคร้ายให้",
        stage='<div class="stage" style="padding:10px"><div class="touch-area" id="touch"><p class="touch-hint" id="touchHint">ทุกคนวางนิ้วบนจอพร้อมกัน</p></div>'
              '<div class="opts"><label class="field"><span>เลือกกี่คน</span><select id="pickN"><option value="1">1 คน</option><option value="2">2 คน</option><option value="3">3 คน</option></select></label></div></div>',
        how="""<h2>วิธีใช้</h2>
<p>วางมือถือไว้กลางวง ทุกคนเอานิ้ว 1 นิ้ววางบนจอ เมื่อไม่มีใครเพิ่มหรือยกนิ้วเป็นเวลา 2 วินาที ระบบจะสุ่มเลือก วงกลมที่ขยายใหญ่คือผู้ถูกเลือก</p>
<p>ใช้ได้มากกว่าเกมวงเหล้า เช่น เลือกคนจ่ายค่าข้าว เลือกคนเริ่มเกมก่อน หรือแบ่งหน้าที่ ต้องใช้บนมือถือหรือแท็บเล็ตจอสัมผัสที่รองรับหลายนิ้ว (ส่วนใหญ่รองรับ 5–10 นิ้ว)</p>""",
        faq=[("วางได้กี่นิ้ว?", "ขึ้นกับรุ่นมือถือ ส่วนใหญ่รองรับ 5–10 นิ้วพร้อมกัน"),
             ("ใช้บนคอมได้ไหม?", "ไม่ได้ ต้องใช้จอสัมผัสที่วางได้หลายนิ้ว")],
    ),
    dict(
        slug="never-have-i-ever", vibes=True, game="never", icon="🙊",
        name="ฉันไม่เคย", card="อ่านประโยค “ฉันไม่เคย…” ใครเคยทำต้องโดน",
        title="เกมฉันไม่เคย (Never Have I Ever) ภาษาไทย 60+ ข้อ",
        desc="เกมฉันไม่เคย Never Have I Ever ภาษาไทย รวมคำถามกว่า 60 ข้อ อ่านประโยค ใครเคยทำต้องดื่ม เล่นบนมือถือ รู้ความลับเพื่อนในวง",
        h1="ฉันไม่เคย", lead="อ่านประโยคบนจอให้ทุกคนฟัง ใครเคยทำเรื่องนั้นต้องโดนลงโทษ แตะการ์ดเพื่อเปลี่ยนข้อ",
        stage='<div class="stage"><div class="turn" id="turn"></div><div class="qcard" id="qcard" aria-live="polite"></div>'
              '<button class="btn big" id="next" type="button">ข้อต่อไป</button></div>',
        how="""<h2>วิธีเล่นฉันไม่เคย</h2>
<p>ผลัดกันอ่านประโยค “ฉันไม่เคย…” ให้ทุกคนฟัง ใครเคยทำเรื่องนั้นแล้ว ต้องดื่มหรือทำภารกิจ เป็นเกมที่ทำให้ได้รู้เรื่องที่ไม่เคยรู้ของเพื่อน ห้ามโกหก!</p>
<p>เพิ่มความสนุก: คนที่เคยทำต้องเล่าเรื่องนั้นสั้นๆ ให้วงฟังด้วย</p>""",
        faq=[("ถ้าคนอ่านเองเคยทำล่ะ?", "ก็ต้องโดนเหมือนกัน"),
             ("คำถามซ้ำไหม?", "ไม่ซ้ำจนกว่าจะเล่นครบทุกข้อ")],
    ),
    dict(
        slug="most-likely", vibes=True, game="likely", icon="👉",
        name="ใครมีแนวโน้มที่สุด", card="นับ 1-2-3 ชี้พร้อมกัน คนโดนชี้เยอะสุดโดน",
        title="เกมใครมีแนวโน้มที่สุด (Most Likely To) ภาษาไทย ชี้พร้อมกัน",
        desc="เกมใครมีแนวโน้มที่สุด Most Likely To ภาษาไทย ทุกคนชี้พร้อมกันว่าใครในวงมีแนวโน้มจะทำเรื่องนั้นมากที่สุด คนที่ถูกชี้มากที่สุดต้องดื่ม",
        h1="ใครมีแนวโน้มที่สุด", lead="อ่านโจทย์ แล้วนับ 1-2-3 ทุกคนชี้พร้อมกันว่าใครในวงมีแนวโน้มจะเป็นแบบนั้นที่สุด",
        stage='<div class="stage"><div class="turn" id="turn"></div><div class="qcard" id="qcard" aria-live="polite"></div>'
              '<button class="btn big" id="next" type="button">ข้อต่อไป</button></div>',
        how="""<h2>วิธีเล่น</h2><p>อ่านโจทย์ให้ทุกคนฟัง นับ 1-2-3 แล้วทุกคนชี้ไปที่คนที่คิดว่าใช่ที่สุดพร้อมกัน คนที่ถูกชี้มากที่สุดโดนลงโทษ ถ้าคะแนนเท่ากันโดนทุกคนที่เสมอ</p>""",
        faq=[("ชี้ตัวเองได้ไหม?", "ได้ ถ้าคิดว่าตัวเองใช่ที่สุด"),
             ("เล่นกี่คนดี?", "ตั้งแต่ 4 คนขึ้นไปจะสนุก ยิ่งคนเยอะยิ่งลุ้น")],
    ),
    dict(
        slug="would-you-rather", vibes=True, game="wyr", icon="⚖️",
        name="อันไหนดีกว่ากัน", card="เลือกระหว่าง 2 ทาง ฝั่งเสียงน้อยโดน",
        title="เกมอันไหนดีกว่ากัน (Would You Rather) ภาษาไทย 2 ตัวเลือก",
        desc="เกมอันไหนดีกว่ากัน Would You Rather ภาษาไทย เลือกระหว่างสองทางยากๆ ทุกคนเลือกพร้อมกัน ฝั่งที่มีคนน้อยกว่าต้องดื่ม เกมเถียงกันสนุกในวง",
        h1="อันไหนดีกว่ากัน", lead="อ่านสองตัวเลือก แล้วนับ 1-2-3 ทุกคนเลือกพร้อมกัน ฝั่งที่มีคนน้อยกว่าโดน",
        stage='<div class="stage"><div class="turn" id="turn"></div><div class="qcard" id="qcard" aria-live="polite"></div>'
              '<button class="btn big" id="next" type="button">ข้อต่อไป</button></div>',
        how="""<h2>วิธีเล่น</h2><p>นับ 1-2-3 ทุกคนยกมือซ้าย (เลือกข้อบน) หรือมือขวา (เลือกข้อล่าง) พร้อมกัน ฝั่งที่มีคนน้อยกว่าโดนลงโทษ แล้วให้แต่ละฝั่งเถียงกันว่าทำไมเลือกแบบนั้น</p>""",
        faq=[("ถ้าเสมอกันล่ะ?", "โดนทั้งสองฝั่ง หรือให้คนอ่านเป็นคนตัดสิน")],
    ),
    dict(
        slug="charades", game="charades", icon="🎭",
        name="ใบ้คำ", card="ยกมือถือขึ้นหน้าผาก เพื่อนใบ้ท่าทาง ทายให้ทันเวลา",
        title="เกมใบ้คำ ยกมือถือขึ้นหน้าผาก ทายคำจากท่าทาง ภาษาไทย",
        desc="เกมใบ้คำบนมือถือ ยกโทรศัพท์ขึ้นหน้าผาก เพื่อนใบ้ท่าทางให้ทาย 6 หมวด สัตว์ อาหาร อาชีพ ท่าทาง สิ่งของ สถานที่ จับเวลา นับคะแนนอัตโนมัติ",
        h1="ใบ้คำ", lead="คนทายยกมือถือไว้ที่หน้าผากให้เพื่อนเห็นคำ เพื่อนใบ้ด้วยท่าทางหรือคำพูด แตะจอขวาเมื่อทายถูก แตะซ้ายเพื่อข้าม",
        stage='<div class="stage" id="setup"><h2 style="margin:0">เลือกหมวด</h2><div class="pills" id="cats"></div>'
              '<div class="opts"><label class="field"><span>เวลาต่อรอบ</span><select id="secs"><option value="60">60 วินาที</option>'
              '<option value="90">90 วินาที</option><option value="120">120 วินาที</option></select></label></div>'
              '<button class="btn big" id="start" type="button">เริ่มเล่น</button><p class="note">แนะนำให้หมุนมือถือเป็นแนวนอน</p></div>'
              '<div class="charade-play" id="play" hidden><div class="charade-bar"><button class="btn ghost" id="quit" type="button">ออก</button>'
              '<span class="clock" id="clock"></span></div><div class="charade-zones"><button id="pass" type="button">← ข้าม</button>'
              '<button id="hit" type="button">ถูก ✓</button><div class="word" id="word"></div></div></div>'
              '<div class="stage" id="end" hidden><h2 style="margin:0">หมดเวลา!</h2><div class="range"><span id="score">0</span> คำ</div>'
              '<div class="words" id="words"></div><p class="hint" id="endPen"></p><button class="btn big" id="again" type="button">เล่นอีกรอบ</button></div>',
        how="""<h2>วิธีเล่นใบ้คำ</h2>
<ol><li>แบ่งทีม ทีมละ 2 คนขึ้นไป เลือกหมวดและเวลา</li><li>คนทายยกมือถือไว้ที่หน้าผาก หันจอออกให้เพื่อนในทีมเห็น</li>
<li>เพื่อนใบ้ด้วยท่าทาง (หรือคำพูดที่ไม่ใช่คำนั้น) ทายถูกแตะจอฝั่งขวา ข้ามแตะฝั่งซ้าย</li>
<li>หมดเวลาระบบนับคะแนนให้ เปลี่ยนทีมเล่นต่อ ทีมที่ได้น้อยที่สุดโดนลงโทษ</li></ol>""",
        faq=[("มีกี่คำ?", "6 หมวด หมวดละ 30 คำ รวม 180 คำ เลือก “สุ่มทุกหมวด” เพื่อให้ยากขึ้น"),
             ("ใช้การเอียงมือถือได้ไหม?", "เวอร์ชันนี้ใช้การแตะจอซ้าย/ขวา ซึ่งแม่นกว่าและใช้ได้กับทุกรุ่น")],
    ),
    dict(
        slug="drinking-dice", vibes=True, vibe_note="เกมนี้ใช้กติกาเดิมทุกสาย แต่ถ้าเลือกสายกิน จำนวนจิบจะเพิ่มเป็น 2 เท่า", game="dice", icon="🎲",
        name="ลูกเต๋าวงเหล้า", card="ลูกแรกบอกว่าใคร ลูกที่สองบอกว่ากี่จิบ + โยนเหรียญ",
        title="ลูกเต๋าวงเหล้า ทอยลูกเต๋าออนไลน์ บอกว่าใครดื่ม กี่จิบ",
        desc="ลูกเต๋าวงเหล้าบนมือถือ ทอยลูกเต๋า 2 ลูก ลูกแรกบอกว่าใครโดน ลูกที่สองบอกว่ากี่จิบ ออกดับเบิลทอยต่อ พร้อมโยนเหรียญหัวก้อย",
        h1="ลูกเต๋าวงเหล้า", lead="แตะลูกเต๋าเพื่อทอย ลูกแรกบอกว่าใครโดน ลูกที่สองบอกว่ากี่จิบ ถ้าออกเลขเหมือนกันทอยต่ออีกรอบ",
        stage='<div class="stage"><div class="dice" id="diceWrap"><div class="die" id="d1"></div><div class="die" id="d2"></div></div>'
              '<div class="result" id="result" aria-live="polite">&nbsp;</div><button class="btn big" id="roll" type="button">ทอยลูกเต๋า</button>'
              '<h2 style="margin:10px 0 0">โยนเหรียญ</h2><div class="coin" id="coinFace">?</div><button class="btn ghost" id="coin" type="button">หัวหรือก้อย</button></div>',
        how="""<h2>ความหมายของลูกเต๋าลูกแรก</h2>
<ul><li>⚀ ตัวเอง · ⚁ คนทางซ้าย · ⚂ คนทางขวา</li><li>⚃ คนฝั่งตรงข้าม · ⚄ เลือกใครก็ได้ 1 คน · ⚅ ทุกคนในวง</li></ul>
<p>ลูกที่สองคือจำนวนจิบ (ในโหมดไม่ดื่มจะเป็นภารกิจแทน) ถ้าสองลูกออกเลขเหมือนกัน คนทอยได้ทอยต่ออีกรอบ</p>""",
        faq=[("สุ่มจริงไหม?", "จริง ใช้ตัวสุ่มเชิงรหัสของเบราว์เซอร์ ทุกหน้ามีโอกาสเท่ากัน")],
    ),
    dict(
        slug="penalty-wheel", vibes=True, game="wheel", icon="🎡",
        name="วงล้อลงโทษ", card="หมุนวงล้อสุ่มบทลงโทษ แก้รายการเองได้",
        title="วงล้อลงโทษ สุ่มบทลงโทษในวงเหล้า หมุนวงล้อออนไลน์",
        desc="วงล้อลงโทษบนมือถือ หมุนสุ่มบทลงโทษในวงเหล้าหรือปาร์ตี้ แก้ไขรายการได้เอง มีชุดบทลงโทษแบบดื่มและแบบไม่ดื่ม",
        h1="วงล้อลงโทษ", lead="ใครแพ้เกมไหนก็มาหมุนวงล้อนี้ แก้ไขรายการบทลงโทษได้เองด้านล่าง",
        stage='<div class="stage"><div class="wheel-box"><canvas id="wheel" width="600" height="600" aria-label="วงล้อลงโทษ"></canvas><div class="wheel-pin"></div></div>'
              '<div class="result" id="result" aria-live="polite">&nbsp;</div><button class="btn big" id="spin" type="button">หมุนวงล้อ</button></div>'
              '<details class="panel"><summary>✏️ แก้ไขรายการบนวงล้อ</summary><label class="field"><span>บรรทัดละ 1 รายการ</span>'
              '<textarea id="items" rows="10"></textarea></label><button class="btn ghost" id="defaults" type="button">คืนค่าเริ่มต้น</button></details>',
        how="""<h2>ใช้วงล้อลงโทษอย่างไร</h2><p>ใช้คู่กับเกมไหนก็ได้ ใครแพ้ให้มาหมุนวงล้อ รายการในโหมดดื่มและโหมดไม่ดื่มแยกกัน และระบบจะจำรายการที่แก้ไขไว้ในมือถือเครื่องนี้</p>""",
        faq=[("ใส่รายการได้กี่ข้อ?", "ไม่จำกัด แต่ถ้าเกิน 16 ข้อ ตัวหนังสือบนวงล้อจะเล็กลง")],
    ),
]


# ------------------------------------------------------------------ สายเกม
VIBES = [
    dict(key="fun", tag="เล่นได้ทุกวง", icon="😂", name="ฮา", slug="funny",
         title="เกมวงเหล้าสายฮา คำถามฮาๆ เล่นได้ทุกวง",
         desc="รวมเกมวงเหล้าสายฮา คำถามจริงหรือกล้า ฉันไม่เคย ใครมีแนวโน้มที่สุด แบบขำๆ เล่นได้ทุกวง ทั้งเพื่อนสนิทและคนเพิ่งรู้จัก",
         lead="สายเริ่มต้นที่เล่นได้กับทุกวง คำถามขำๆ ไม่ลึกเกินไป เหมาะเปิดวงหรือเล่นกับคนที่เพิ่งรู้จัก",
         samples=["ถ้าถูกหวย 10 ล้าน จะบอกใครเป็นคนแรก", "ฉันไม่เคยนั่งรถผิดสาย", "ใครในวงมีแนวโน้มจะตายเป็นคนแรกในหนังผี",
                  "เลียนแบบเสียงสัตว์ 3 ชนิดติดกัน", "มีแมว 10 ตัว หรือ มีหมา 10 ตัว"]),
    dict(key="spicy", tag="20+ จีบกัน หยอกกัน", icon="🔥", name="ทะลึ่ง", slug="spicy", adult=True,
         title="เกมวงเหล้าสายทะลึ่ง 20+ คำถามจริงหรือกล้าแบบทะลึ่ง",
         desc="เกมวงเหล้าสายทะลึ่ง 20+ คำถามจริงหรือกล้า ฉันไม่เคย ใครมีแนวโน้ม เรื่องความรัก การจีบ และความลับหัวใจ ทะลึ่งพอขำ ไม่หยาบ เล่นบนมือถือ",
         lead="คำถามเรื่องจีบ ความรัก และความลับหัวใจ ทะลึ่งพอให้วงกรี๊ด แต่ไม่หยาบคาย สำหรับผู้ที่อายุ 20 ปีขึ้นไป",
         samples=["ในวงนี้ ใครที่คิดว่าจูบเก่งที่สุด", "ฉันไม่เคยจูบคนที่เพิ่งรู้จักวันเดียว", "ใครในวงมีแนวโน้มจะถูกขอไลน์คืนนี้",
                  "จีบคนทางขวาด้วยมุกจีบที่เลี่ยนที่สุด", "แฟนหึงมาก หรือ แฟนไม่หึงเลย"]),
    dict(key="drink", tag="ดื่มคูณสอง", icon="🍻", name="กิน", slug="drink-hard",
         title="เกมวงเหล้าสายกิน บทลงโทษดื่มคูณสอง คำถามเรื่องเมา",
         desc="เกมวงเหล้าสายกิน สำหรับวงที่พร้อมลุย บทลงโทษดื่มเป็น 2 เท่า คำถามเรื่องเมาและวีรกรรมตอนเมา ไพ่วงเหล้า วงล้อลงโทษ สายโหด",
         lead="สำหรับวงที่พร้อมลุย บทลงโทษดื่มเป็น 2 เท่าทุกเกม คำถามเรื่องวีรกรรมตอนเมา แต่อย่าลืมดื่มน้ำเปล่าสลับด้วย",
         samples=["ทำอะไรน่าอายที่สุดตอนเมา", "ฉันไม่เคยบอกว่า “ไม่ดื่มแล้ว” แล้วดื่มต่อ", "ใครในวงมีแนวโน้มจะพูดว่าแก้วสุดท้ายแล้วไม่จริง",
                  "แข่งดื่มน้ำเปล่า 1 แก้วกับคนทางซ้าย", "ตื่นมาจำอะไรไม่ได้ หรือ ตื่นมาจำได้ทุกอย่างที่ทำ"]),
    dict(key="deep", tag="คุยกันลึกๆ", icon="💔", name="เจาะใจ", slug="deep-talk",
         title="เกมวงเหล้าสายเจาะใจ คำถามลึกซึ้ง คุยกับเพื่อนสนิท",
         desc="เกมสายเจาะใจ คำถามลึกซึ้งสำหรับวงเพื่อนสนิท จริงหรือกล้า ฉันไม่เคย อันไหนดีกว่ากัน เรื่องความรัก ความฝัน ความกลัว ให้วงได้คุยกันจริงจัง",
         lead="สำหรับวงเพื่อนสนิทที่อยากคุยกันจริงจัง เรื่องความฝัน ความรัก และสิ่งที่ไม่เคยพูด ดึกๆ แล้วเล่นสายนี้ดีที่สุด",
         samples=["ถ้าบอกตัวเองตอนอายุ 15 ได้ 1 ประโยค จะบอกว่าอะไร", "ฉันไม่เคยรักใครข้างเดียวนานเกิน 1 ปี",
                  "ใครในวงมีแนวโน้มจะยิ้มทั้งที่ข้างในเศร้า", "ขอบคุณคนในวงที่เคยช่วยคุณ พร้อมบอกเหตุผล",
                  "รู้ความจริงที่เจ็บปวด หรือ อยู่กับคำโกหกที่มีความสุข"]),
    dict(key="couple", tag="เล่นกับแฟน 2 คน", icon="💑", name="คู่รัก", slug="couple",
         title="เกมคู่รัก คำถามคู่รัก จริงหรือกล้าสำหรับแฟน เล่น 2 คน",
         desc="เกมสำหรับคู่รักเล่น 2 คน คำถามคู่รัก จริงหรือกล้าสำหรับแฟน ใครมีแนวโน้มจะงอนก่อน ฉันไม่เคย ช่วยให้รู้จักกันมากขึ้น เล่นบนมือถือเครื่องเดียว",
         lead="เล่นกันสองคนกับแฟน ผลัดกันตอบคำถาม ท้าทายกันน่ารักๆ และได้รู้เรื่องที่ไม่เคยรู้ของอีกคน",
         samples=["ช่วงไหนที่รู้ว่ารักอีกคนจริงๆ", "ฉันไม่เคยแอบอ่านแชตแฟน", "ในเราสองคน ใครมีแนวโน้มจะงอนก่อน",
                  "พูดสิ่งที่รักในตัวอีกคน 5 ข้อ", "เดตที่บ้านดูหนัง หรือ เดตข้างนอกกินข้าวหรู"]),
]
VIBE_GAMES = ["truth-or-dare", "never-have-i-ever", "most-likely", "would-you-rather", "penalty-wheel"]


def vibe_bar(note=""):
    btns = ''.join(f'<button type="button" data-vibe="{v["key"]}">{v["icon"]} {v["name"]}</button>' for v in VIBES)
    btns += '<button type="button" data-vibe="all">🎲 รวม</button>'
    n = f'<p class="note vibe-note">{note}</p>' if note else ''
    return f'<div class="vibes" role="group" aria-label="เลือกสายของเกม"><span class="vibes-label">สาย:</span>{btns}</div>{n}'


# ------------------------------------------------------------------ แม่แบบ
def head(title, desc, canonical, root, lds=()):
    ad = (f'<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client={ADSENSE_CLIENT}" crossorigin="anonymous"></script>'
          if ADSENSE_CLIENT else '')
    verify = f'<meta name="google-site-verification" content="{html.escape(GOOGLE_VERIFY)}">' if GOOGLE_VERIFY else ''
    ld = ''.join(f'<script type="application/ld+json">{json.dumps(x, ensure_ascii=False)}</script>' for x in lds)
    t, d = html.escape(title), html.escape(desc)
    return f"""<!doctype html>
<html lang="th" data-mode="drink">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{t}</title>
<meta name="description" content="{d}">
<link rel="canonical" href="{canonical}">
<meta property="og:type" content="website"><meta property="og:title" content="{t}"><meta property="og:description" content="{d}">
<meta property="og:url" content="{canonical}"><meta property="og:site_name" content="{SITE_NAME}"><meta property="og:locale" content="th_TH">
<meta name="theme-color" content="#0f0c1b">
<meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
{verify}
<link rel="icon" href="{FAVICON}">
<link rel="manifest" href="{root}manifest.json">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Kanit:wght@500;600;700&family=IBM+Plex+Sans+Thai:wght@400;500;600&display=swap">
<link rel="stylesheet" href="{root}assets/style.css">
{ad}{ld}
</head>"""


def header(root):
    return (f'<header class="top"><div class="wrap"><a class="brand" href="{root}">{LOGO}<span>{SITE_NAME}</span></a>'
            '<div class="mode" role="group" aria-label="โหมดบทลงโทษ">'
            '<button type="button" data-mode-btn="drink">🍺 ดื่ม</button><button type="button" data-mode-btn="soft">🎯 ไม่ดื่ม</button></div></div></header>')


def footer(root):
    return (f'<footer><div class="wrap"><span class="warn-line">⚠️ ดื่มอย่างรับผิดชอบ · เมาไม่ขับ · ห้ามจำหน่ายและให้บริการแก่ผู้มีอายุต่ำกว่า 20 ปี · '
            'ถ้าไม่ดื่ม เลือกโหมด “ไม่ดื่ม” ได้ทุกเกม</span>'
            f'<span>© {BE} {SITE_NAME} · {SITE_TAGLINE} · <a href="{root}about/">เกี่ยวกับเรา</a> · '
            f'<a href="{root}privacy/">นโยบายความเป็นส่วนตัว</a></span></div></footer>')


def scripts(root):
    return (f'<script src="{root}assets/data.js" defer></script><script src="{root}assets/packs.js" defer></script>'
            f'<script src="{root}assets/app.js" defer></script>'
            f'<script src="{root}assets/games.js" defer></script>')


def game_cards(root, games):
    return '<div class="games">' + ''.join(
        f'<a class="game" href="{root}{g["slug"]}/"><span class="ic" aria-hidden="true">{g["icon"]}</span>'
        f'<div><strong>{g["name"]}</strong><span>{g["card"]}</span></div>'
        + (f'<em>{g["badge"]}</em>' if g.get("badge") else '') + '</a>' for g in games) + '</div>'


def write(rel, text):
    p = OUT / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding="utf-8")


def game_page(g):
    root, url = "../", f'{SITE_URL}/{g["slug"]}/'
    lds = [
        {"@context": "https://schema.org", "@type": "WebApplication", "name": g["h1"], "url": url, "description": g["desc"],
         "applicationCategory": "GameApplication", "operatingSystem": "Any", "inLanguage": "th",
         "offers": {"@type": "Offer", "price": "0", "priceCurrency": "THB"}},
        {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
            {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in g["faq"]]},
    ]
    faq = ''.join(f'<details><summary>{q}</summary><p>{a}</p></details>' for q, a in g["faq"])
    others = [x for x in GAMES if x is not g][:6]
    body = f"""
<body data-game="{g["game"]}">
{header(root)}
<main class="wrap">
<nav class="crumb"><a href="{root}">{SITE_NAME}</a> › {g["name"]}</nav>
<h1>{g["icon"]} {g["h1"]}</h1>
<p class="lead">{g["lead"]}</p>
{vibe_bar(g.get("vibe_note", "")) if g.get("vibes") else ''}
{g["stage"]}
{PLAYERS if g.get("players") else ''}
<section class="prose">{g["how"]}</section>
<section class="prose faq"><h2>คำถามที่พบบ่อย</h2>{faq}</section>
<section class="prose"><h2>เกมอื่นที่เล่นต่อได้เลย</h2>{game_cards(root, others)}
<p><a href="{root}">ดูเกมทั้งหมด {len(GAMES)} เกม →</a></p></section>
</main>
{footer(root)}
{scripts(root)}
</body>
</html>
"""
    write(f'{g["slug"]}/index.html', head(f'{g["title"]} | {SITE_NAME}', g["desc"], url, root, lds) + body)


def index_page():
    desc = (f"รวม {len(GAMES)} เกมวงเหล้าและเกมปาร์ตี้บนมือถือ ไพ่วงเหล้า จริงหรือกล้า หมุนขวด เลขระเบิด ระเบิดเวลา "
            "วางนิ้วสุ่มคน ใบ้คำ เล่นฟรี ไม่ต้องโหลดแอป มีโหมดไม่ดื่ม")
    lds = [{"@context": "https://schema.org", "@type": "WebSite", "name": SITE_NAME, "url": SITE_URL + "/", "inLanguage": "th"},
           {"@context": "https://schema.org", "@type": "ItemList", "itemListElement": [
               {"@type": "ListItem", "position": i + 1, "name": g["name"], "url": f'{SITE_URL}/{g["slug"]}/'} for i, g in enumerate(GAMES)]}]
    body = f"""
<body>
{header("./")}
<main class="wrap">
<section class="hero">
<h1>วงไหนเงียบ<br><span>เปิดเว็บนี้</span></h1>
<p>รวม {len(GAMES)} เกมวงเหล้าและเกมปาร์ตี้ เล่นด้วยมือถือเครื่องเดียว ไม่ต้องโหลดแอป ไม่ต้องสมัคร เปิดแล้วเล่นได้เลย
ไม่ดื่มก็เล่นได้ แค่กดโหมด “ไม่ดื่ม” บทลงโทษจะเปลี่ยนเป็นภารกิจฮาๆ แทน</p>
<div class="row" style="justify-content:flex-start"><a class="btn big" href="./card-game/">🃏 เริ่มด้วยไพ่วงเหล้า</a>
<button class="btn alt" type="button" data-install hidden>📲 ติดตั้งลงมือถือ</button></div>
</section>
<h2>เลือกสายของวง</h2>
<div class="vibe-cards">{''.join(f'<a class="vibe-card v-{v["key"]}" href="./{v["slug"]}/"><b>{v["icon"]}</b><strong>สาย{v["name"]}</strong><span>{v["tag"]}</span></a>' for v in VIBES)}</div>
<h2>เลือกเกม</h2>
{game_cards("./", GAMES)}
<div class="setup-card"><h2>👥 ใส่ชื่อเพื่อนในวงไว้ก่อน</h2><p class="note">บางเกมจะบอกว่าถึงตาใคร ใส่ตามลำดับที่นั่งวนรอบวง</p>
<div class="players-add"><input id="playerName" placeholder="ชื่อเพื่อน (ใส่หลายชื่อคั่นด้วย ,)" autocomplete="off">
<button class="btn alt" id="addPlayer" type="button">เพิ่ม</button></div><div class="chips" id="players"></div><span id="playerCount" hidden></span></div>
<section class="prose">
<h2>เกมวงเหล้าเล่นอะไรดี</h2>
<p>ถ้าวงเพิ่งเริ่ม ลอง <a href="./card-game/">ไพ่วงเหล้า</a> หรือ <a href="./number-bomb/">เลขระเบิด</a> ที่เล่นง่ายและทุกคนได้ร่วม
ถ้าอยากให้วงคุยกันมากขึ้น เล่น <a href="./never-have-i-ever/">ฉันไม่เคย</a> หรือ <a href="./truth-or-dare/">จริงหรือกล้า</a>
ถ้าอยากให้ตื่นเต้น ลอง <a href="./time-bomb/">ระเบิดเวลา</a> และ <a href="./charades/">ใบ้คำ</a> แบ่งทีมแข่งกัน</p>
<p><b>เล่นในร้านเน็ตไม่ดีก็ได้:</b> เปิดเว็บนี้ครั้งแรกตอนมีเน็ต ครั้งต่อไปจะเปิดได้แม้สัญญาณอ่อน และบันทึกลงหน้าจอหลักให้เหมือนแอปได้</p>
</section>
</main>
{footer("./")}
{scripts("./")}
</body>
</html>
"""
    write("index.html", head(f"{SITE_NAME} – รวมเกมวงเหล้า เกมปาร์ตี้ เล่นบนมือถือ ฟรี", desc, SITE_URL + "/", "./", lds) + body)


def vibe_page(v):
    root, url = "../", f'{SITE_URL}/{v["slug"]}/'
    games = [g for g in GAMES if g["slug"] in VIBE_GAMES or g.get("vibes")]
    cards = '<div class="games">' + ''.join(
        f'<a class="game" href="{root}{g["slug"]}/?vibe={v["key"]}"><span class="ic" aria-hidden="true">{g["icon"]}</span>'
        f'<div><strong>{g["name"]}</strong><span>{g["card"]}</span></div></a>' for g in games) + '</div>'
    samples = ''.join(f'<li>{html.escape(s)}</li>' for s in v["samples"])
    others = ''.join(f'<a class="chip-link" href="{root}{o["slug"]}/">{o["icon"]} สาย{o["name"]}</a>' for o in VIBES if o is not v)
    gate = ('<p class="warn-line">🔞 สายนี้สำหรับผู้ที่มีอายุ 20 ปีขึ้นไปเท่านั้น ทุกภารกิจที่แตะต้องตัวต้องได้รับความยินยอมจากอีกฝ่ายเสมอ</p>'
            if v.get("adult") else '')
    body = f"""
<body>
{header(root)}
<main class="wrap">
<nav class="crumb"><a href="{root}">{SITE_NAME}</a> › สาย{v["name"]}</nav>
<h1>{v["icon"]} เกมวงเหล้าสาย{v["name"]}</h1>
<p class="lead">{v["lead"]}</p>
{gate}
<h2>เลือกเกมที่จะเล่นในสาย{v["name"]}</h2>
{cards}
<section class="prose">
<h2>ตัวอย่างคำถามสาย{v["name"]}</h2>
<ul>{samples}</ul>
<p>แตะเกมด้านบนเพื่อเริ่มเล่น ระบบจะเลือกสาย{v["name"]}ให้อัตโนมัติ และเปลี่ยนสายได้ตลอดจากแถบ “สาย” ในหน้าเกม ถ้าในวงมีคนไม่ดื่ม กดโหมด “ไม่ดื่ม” มุมขวาบนได้เลย</p>
<h2>สายอื่นๆ</h2><div class="chip-links">{others}</div>
</section>
</main>
{footer(root)}
{scripts(root)}
</body>
</html>
"""
    lds = [{"@context": "https://schema.org", "@type": "CollectionPage", "name": v["title"], "url": url, "inLanguage": "th", "description": v["desc"]}]
    write(f'{v["slug"]}/index.html', head(f'{v["title"]} | {SITE_NAME}', v["desc"], url, root, lds) + body)


def simple_page(slug, title, content):
    root = "../"
    body = (f'<body>{header(root)}<main class="wrap prose"><nav class="crumb"><a href="{root}">{SITE_NAME}</a> › {title}</nav>'
            f'<h1>{title}</h1>{content}</main>{footer(root)}{scripts(root)}</body></html>')
    write(f"{slug}/index.html", head(f"{title} | {SITE_NAME}", f"{title} ของเว็บไซต์ {SITE_NAME}", f"{SITE_URL}/{slug}/", root) + body)


def static_pages():
    simple_page("about", "เกี่ยวกับเรา", f"""
<p>{SITE_NAME} รวมเกมที่เล่นกันในวงเพื่อน ปาร์ตี้ และวงเหล้า ให้เล่นได้ด้วยมือถือเครื่องเดียว ไม่ต้องพกไพ่ ลูกเต๋า หรือขวด และไม่ต้องติดตั้งแอป</p>
<p>ทุกเกมมีโหมด “ไม่ดื่ม” ที่เปลี่ยนบทลงโทษเป็นภารกิจสนุกๆ เพื่อให้ทุกคนเล่นด้วยกันได้ เราสนับสนุนการดื่มอย่างรับผิดชอบ
ไม่ดื่มแล้วขับ และไม่สนับสนุนให้ผู้มีอายุต่ำกว่า 20 ปีดื่มเครื่องดื่มแอลกอฮอล์</p>
<p>เว็บไซต์นี้ไม่ได้โฆษณาหรือส่งเสริมการขายเครื่องดื่มแอลกอฮอล์ยี่ห้อใด</p>""")
    simple_page("privacy", "นโยบายความเป็นส่วนตัว", f"""
<p>ปรับปรุงล่าสุด: {TODAY}</p>
<h2>ข้อมูลที่คุณกรอก</h2><p>ชื่อผู้เล่น กติกาที่แก้ไข และการตั้งค่า เก็บไว้ในเบราว์เซอร์ของมือถือคุณเท่านั้น ไม่ถูกส่งไปยังเซิร์ฟเวอร์ใด</p>
<h2>คุกกี้และโฆษณา</h2><p>เว็บไซต์นี้อาจแสดงโฆษณาจากผู้ให้บริการภายนอก รวมถึง Google ซึ่งใช้คุกกี้เพื่อแสดงโฆษณาตามการเข้าชมเว็บไซต์นี้และเว็บไซต์อื่น
คุณเลือกไม่รับโฆษณาที่ปรับตามความสนใจได้ที่ <a href="https://adssettings.google.com" rel="nofollow">การตั้งค่าโฆษณาของ Google</a></p>""")


def seo_and_pwa():
    urls = [SITE_URL + "/"] + [f'{SITE_URL}/{g["slug"]}/' for g in GAMES] + [f'{SITE_URL}/{v["slug"]}/' for v in VIBES] + [f"{SITE_URL}/about/", f"{SITE_URL}/privacy/"]
    write("sitemap.xml", '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
          + ''.join(f"  <url><loc>{u}</loc><lastmod>{TODAY}</lastmod></url>\n" for u in urls) + '</urlset>\n')
    write("robots.txt", f"User-agent: *\nAllow: /\n\nSitemap: {SITE_URL}/sitemap.xml\n")
    write(".nojekyll", "")
    icon = LOGO.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')
    write("icon.svg", icon)
    write("manifest.json", json.dumps({
        "name": f"{SITE_NAME} – เกมวงเหล้า", "short_name": SITE_NAME, "lang": "th", "start_url": "./", "scope": "./",
        "display": "standalone", "background_color": "#0f0c1b", "theme_color": "#0f0c1b",
        "icons": [{"src": "icon.svg", "sizes": "any", "type": "image/svg+xml", "purpose": "any"}],
    }, ensure_ascii=False, indent=1))
    # service worker: เก็บทุกหน้าไว้เล่นตอนเน็ตไม่ดี
    files = sorted(p.relative_to(OUT).as_posix() for p in OUT.rglob("*") if p.is_file() and p.name not in ("sw.js",))
    pages = ["./"] + [f.replace("index.html", "") for f in files if f.endswith("index.html") and f != "index.html"]
    assets = [f for f in files if f.startswith("assets/") or f in ("manifest.json", "icon.svg")]
    ver = hashlib.md5("".join((OUT / f).read_text(encoding="utf-8", errors="ignore") for f in files).encode()).hexdigest()[:10]
    write("sw.js", f"""const CACHE = 'wmg-{ver}';
const FILES = {json.dumps(pages + assets, ensure_ascii=False)};
self.addEventListener('install', (e) => {{ e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); }});
self.addEventListener('activate', (e) => {{ e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); }});
self.addEventListener('fetch', (e) => {{
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {{
    // หน้าเว็บ: ลองเน็ตก่อน ถ้าไม่มีใช้ของที่เก็บไว้
    e.respondWith(fetch(req).then((r) => {{ const c = r.clone(); caches.open(CACHE).then((cc) => cc.put(req, c)); return r; }})
      .catch(() => caches.match(req, {{ ignoreSearch: true }}).then((r) => r || caches.match('./'))));
  }} else if (url.hostname.endsWith('gstatic.com') || url.hostname.endsWith('googleapis.com')) {{
    e.respondWith(caches.match(req).then((r) => r || fetch(req).then((res) => {{ const c = res.clone(); caches.open(CACHE).then((cc) => cc.put(req, c)); return res; }})));
  }}
}});
""")


def main():
    if OUT.exists():
        shutil.rmtree(OUT)
    shutil.copytree(ROOT / "src" / "assets", OUT / "assets")
    if (ROOT / "static").exists():
        shutil.copytree(ROOT / "static", OUT, dirs_exist_ok=True)
    index_page()
    for g in GAMES:
        game_page(g)
    for v in VIBES:
        vibe_page(v)
    static_pages()
    seo_and_pwa()
    print(f"สร้างเสร็จ {sum(1 for _ in OUT.rglob('*.html'))} หน้า -> {OUT}")


if __name__ == "__main__":
    main()
