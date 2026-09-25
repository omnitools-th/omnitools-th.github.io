# -*- coding: utf-8 -*-
"""สร้างเว็บ "คิดง่าย" เป็นไฟล์ HTML ธรรมดาในโฟลเดอร์ docs/ (ใช้กับ GitHub Pages ได้ทันที)

วิธีใช้:  python build.py
แก้ค่าในส่วน CONFIG ด้านล่าง แล้วรันใหม่ทุกครั้ง
"""
import html
import json
import shutil
from datetime import date
from pathlib import Path

# ============================== CONFIG ==============================
SITE_NAME = "คิดง่าย"
SITE_TAGLINE = "เครื่องมือคำนวณภาษาไทย ใช้ฟรี ไม่ต้องสมัคร"
# ที่อยู่เว็บจริง (ไม่มี / ปิดท้าย) เช่น https://kidngai.com หรือ https://kaveek1-rgb.github.io/kidngai
SITE_URL = "https://omnitools-th.github.io"
# รหัส Google AdSense เช่น "ca-pub-1234567890123456"  (เว้นว่าง = ยังไม่แสดงโฆษณา)
ADSENSE_CLIENT = ""
# รหัสยืนยัน Google Search Console (ค่า content ของ meta google-site-verification) เว้นว่างได้
GOOGLE_VERIFY = ""
# อีเมลติดต่อที่จะแสดงในหน้า "เกี่ยวกับเรา" (เว้นว่าง = ไม่แสดง)
CONTACT_EMAIL = ""
# ====================================================================

ROOT = Path(__file__).parent
OUT = ROOT / "docs"
TODAY = date.today().isoformat()

LOGO = ('<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="3" y="3" width="26" height="26" rx="7" fill="currentColor" opacity=".12"/>'
        '<rect x="3" y="3" width="26" height="26" rx="7" fill="none" stroke="currentColor" stroke-width="2"/>'
        '<path d="M10 12h5M12.5 9.5v5M18 12h5M10 20.5h5M18 19h5M18 22h5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>')
FAVICON = ("data:image/svg+xml," + LOGO.replace('currentColor', '%230d6b5f').replace('"', "'").replace('#', '%23')
           .replace('<svg ', "<svg xmlns='http://www.w3.org/2000/svg' "))


from lib import f  # noqa: E402

# หมวดหมู่: key -> (ชื่อ, คำอธิบาย, ไอคอน path ของ SVG 24x24)
CATS = {
    "money": ("เงินและภาษี", "ภาษี VAT ส่วนลด ทอง และการรับเงิน",
              '<path d="M3 7h18v10H3z"/><circle cx="12" cy="12" r="2.5"/><path d="M6 10v4M18 10v4"/>'),
    "home": ("บ้าน รถ และพลังงาน", "ผ่อนบ้าน ผ่อนรถ ค่าไฟ รถ EV โซลาร์เซลล์ ที่ดิน",
             '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>'),
    "work": ("งานและเกษียณ", "เงินชดเชย ค่า OT บำนาญประกันสังคม วางแผนเกษียณ",
             '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>'),
    "health": ("สุขภาพและสิ่งแวดล้อม", "BMI แคลอรี่ ตั้งครรภ์ ฝุ่น PM2.5 ความร้อน",
               '<path d="M12 21s-7-4.5-9-9.5C1.6 7.8 4 4 7.5 4c2 0 3.5 1.2 4.5 2.6C13 5.2 14.5 4 16.5 4 20 4 22.4 7.8 21 11.5 19 16.5 12 21 12 21z"/>'),
    "date": ("วันที่และเวลา", "อายุ นับวัน บวกลบวันที่",
             '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
    "text": ("ข้อความและเครื่องมือ", "แปลงตัวเลขเป็นตัวหนังสือ แก้ภาษา นับตัวอักษร วงล้อสุ่ม",
             '<path d="M4 6h16M4 12h10M4 18h13"/>'),
}


# ------------------------------------------------------------------
# เครื่องมือแต่ละตัว: slug, ชื่อสั้น, title (SEO), description, h1, lead, form, how, faq
# ------------------------------------------------------------------
TOOLS = [
    dict(
        slug="baht-text",
        name="แปลงตัวเลขเป็นตัวหนังสือ",
        card="พิมพ์จำนวนเงิน ได้คำอ่านภาษาไทย “บาทถ้วน” ทันที",
        title="แปลงตัวเลขเป็นตัวหนังสือ บาทถ้วน ภาษาไทย ออนไลน์",
        desc="แปลงจำนวนเงินเป็นตัวอักษรภาษาไทย (บาทถ้วน / สตางค์) สำหรับเขียนเช็ค ใบเสร็จ ใบกำกับภาษี คัดลอกได้ทันที ใช้ฟรี",
        h1="แปลงตัวเลขเป็นตัวหนังสือ (บาทถ้วน)",
        lead="พิมพ์จำนวนเงิน ระบบจะแปลงเป็นคำอ่านภาษาไทยให้ทันที สำหรับเขียนเช็ค ใบเสร็จรับเงิน และใบกำกับภาษี",
        form=f('amount', 'จำนวนเงิน (บาท)', '1250.75', type="text",
               attrs='inputmode="decimal" autocomplete="off" placeholder="เช่น 12,345.50"',
               hint='ใส่จุลภาค (,) ได้ ทศนิยมเกิน 2 ตำแหน่งจะปัดเป็นสตางค์'),
        how="""<h2>หลักการอ่านจำนวนเงินภาษาไทย</h2>
<ul>
<li>เลข 1 ในหลักหน่วยที่มีหลักอื่นนำหน้า อ่านว่า <b>เอ็ด</b> เช่น 21 = ยี่สิบเอ็ด, 101 = หนึ่งร้อยเอ็ด</li>
<li>เลข 2 ในหลักสิบ อ่านว่า <b>ยี่สิบ</b> และเลข 1 ในหลักสิบอ่านว่า <b>สิบ</b> (ไม่ใช่หนึ่งสิบ)</li>
<li>จำนวนที่ไม่มีเศษสตางค์ ลงท้ายด้วย <b>ถ้วน</b> เช่น 500 = ห้าร้อยบาทถ้วน</li>
<li>มีสตางค์ให้อ่านต่อท้าย เช่น 99.50 = เก้าสิบเก้าบาทห้าสิบสตางค์</li>
<li>ตัวเลขเกินล้าน อ่านเป็นชุดละ 6 หลัก เช่น 2,000,000,000,000 = สองล้านล้านบาทถ้วน</li>
</ul>""",
        faq=[
            ("เขียนเช็คต้องใช้คำว่า “ถ้วน” หรือ “บาทถ้วน”?", "ธนาคารนิยมให้เขียนจำนวนเงินตัวอักษรลงท้ายด้วย “บาทถ้วน” เมื่อไม่มีเศษสตางค์ เพื่อป้องกันการเติมข้อความภายหลัง"),
            ("101 บาท อ่านว่าหนึ่งร้อยเอ็ดหรือหนึ่งร้อยหนึ่ง?", "ในเอกสารการเงินนิยมใช้ “หนึ่งร้อยเอ็ดบาทถ้วน” ซึ่งตรงกับฟังก์ชัน BAHTTEXT ของ Excel ส่วนราชบัณฑิตยสถานยอมรับทั้งสองแบบ"),
            ("ใส่ทศนิยม 3 ตำแหน่งได้ไหม?", "ได้ ระบบจะปัดเป็นสตางค์ (2 ตำแหน่ง) ให้อัตโนมัติ เช่น 10.555 จะกลายเป็น 10.56 บาท"),
        ],
    ),
    dict(
        slug="tax",
        name="คำนวณภาษีเงินได้บุคคลธรรมดา",
        card="ภาษีเงินเดือนทั้งปี แยกขั้นบันได พร้อมค่าลดหย่อน",
        title="คำนวณภาษีเงินได้บุคคลธรรมดา จากเงินเดือน (อัตราก้าวหน้า)",
        desc="คำนวณภาษีเงินได้บุคคลธรรมดาจากเงินเดือนและโบนัส หักค่าใช้จ่าย ค่าลดหย่อน ประกันสังคม แสดงภาษีแยกตามขั้นบันได 0–35% ใช้ฟรี",
        h1="คำนวณภาษีเงินได้บุคคลธรรมดา",
        lead="กรอกเงินเดือนและค่าลดหย่อน ระบบคำนวณภาษีทั้งปีตามอัตราก้าวหน้าแบบขั้นบันไดให้ทันที",
        form='<div class="grid2">'
             + f('salary', 'เงินเดือน (บาท/เดือน)', '30000', attrs='min="0"')
             + f('months', 'จำนวนเดือนที่ได้รับ', '12', attrs='min="1" max="12"')
             + f('bonus', 'โบนัสและรายได้พิเศษทั้งปี', '0', attrs='min="0"')
             + f('sso', 'ประกันสังคมที่จ่ายทั้งปี', '', attrs='min="0" placeholder="คิดให้อัตโนมัติ"',
                 hint='เว้นว่าง = คิด 5% ของเงินเดือน สูงสุด 875 บาท/เดือน (ดูยอดจริงได้จากสลิปเงินเดือน)')
             + '</div><fieldset><legend>ค่าลดหย่อน</legend>'
             + '<label class="check"><input id="spouse" type="checkbox"> คู่สมรสไม่มีเงินได้ (60,000 บาท)</label>'
             + '<div class="grid2">'
             + f('kids', 'จำนวนบุตร (คนละ 30,000)', '0', attrs='min="0"')
             + f('parents', 'บิดามารดาอายุ 60+ (คนละ 30,000)', '0', attrs='min="0" max="4"')
             + '</div>'
             + f('other', 'ค่าลดหย่อนอื่นๆ รวม (บาท)', '0', attrs='min="0"',
                 hint='เช่น ประกันชีวิต ประกันสุขภาพ SSF RMF กองทุนสำรองเลี้ยงชีพ ดอกเบี้ยบ้าน เงินบริจาค')
             + '</fieldset>',
        how="""<h2>วิธีคำนวณภาษีเงินได้บุคคลธรรมดา</h2>
<p><code>เงินได้สุทธิ = เงินได้ทั้งปี − ค่าใช้จ่าย − ค่าลดหย่อน</code> จากนั้นนำเงินได้สุทธิไปคิดภาษีแบบขั้นบันได</p>
<div class="tbl-wrap"><table><thead><tr><th>เงินได้สุทธิ (บาท)</th><th>อัตราภาษี</th></tr></thead><tbody>
<tr><td>0 – 150,000</td><td>ยกเว้น</td></tr>
<tr><td>150,001 – 300,000</td><td>5%</td></tr>
<tr><td>300,001 – 500,000</td><td>10%</td></tr>
<tr><td>500,001 – 750,000</td><td>15%</td></tr>
<tr><td>750,001 – 1,000,000</td><td>20%</td></tr>
<tr><td>1,000,001 – 2,000,000</td><td>25%</td></tr>
<tr><td>2,000,001 – 5,000,000</td><td>30%</td></tr>
<tr><td>5,000,001 ขึ้นไป</td><td>35%</td></tr>
</tbody></table></div>
<p>เงินเดือนและโบนัส (เงินได้ประเภท 40(1)) หักค่าใช้จ่ายได้ 50% แต่ไม่เกิน 100,000 บาท และทุกคนได้ลดหย่อนส่วนตัว 60,000 บาท</p>
<p class="note">ผลลัพธ์เป็นการประมาณเพื่อวางแผนเท่านั้น เงื่อนไขค่าลดหย่อนบางรายการมีเพดานและเปลี่ยนได้ทุกปี โปรดตรวจสอบกับกรมสรรพากรก่อนยื่นจริง</p>""",
        faq=[
            ("เงินเดือนเท่าไหร่ถึงต้องเสียภาษี?", "ถ้ามีแค่ค่าลดหย่อนส่วนตัวและประกันสังคม เงินเดือนประมาณ 26,000 บาทขึ้นไป (ปีละราว 310,000 บาท) จะเริ่มมีภาษีที่ต้องจ่าย ลองกรอกตัวเลขของคุณเพื่อดูแบบละเอียด"),
            ("ลดหย่อนบุตรคนที่ 2 ได้ 60,000 ใช่ไหม?", "บุตรคนที่สองเป็นต้นไปที่เกิดตั้งแต่ปี 2561 ลดหย่อนได้คนละ 60,000 บาท เครื่องมือนี้คิดคนละ 30,000 ให้กรอกส่วนต่างเพิ่มในช่อง “ค่าลดหย่อนอื่นๆ”"),
            ("ภาษีที่บริษัทหักไว้ทุกเดือนคืออะไร?", "คือภาษีหัก ณ ที่จ่าย ซึ่งบริษัทประมาณจากรายได้ทั้งปีแล้วหารเฉลี่ยรายเดือน ถ้าหักไว้เกินกว่าภาษีจริง สามารถยื่นขอคืนภาษีได้"),
        ],
    ),
    dict(
        slug="car-loan",
        name="คำนวณค่างวดรถ",
        card="ดาวน์ ดอกเบี้ย จำนวนงวด ได้ค่างวดรวม VAT",
        title="คำนวณค่างวดรถ ผ่อนรถยนต์ ดอกเบี้ยคงที่ รวม VAT",
        desc="คำนวณค่างวดผ่อนรถยนต์และมอเตอร์ไซค์ ใส่ราคารถ เงินดาวน์ ดอกเบี้ย จำนวนงวด เทียบผ่อน 48 60 72 84 งวด รวม VAT 7% ใช้ฟรี",
        h1="คำนวณค่างวดรถ",
        lead="ใส่ราคารถ เงินดาวน์ และดอกเบี้ย เพื่อดูค่างวดต่อเดือนและดอกเบี้ยทั้งหมด เทียบหลายระยะผ่อนได้ในหน้าเดียว",
        form='<div class="grid2">'
             + f('price', 'ราคารถ (บาท)', '800000', attrs='min="0"')
             + f('down', 'เงินดาวน์ (%)', '25', attrs='min="0" max="100" step="any"')
             + f('rate', 'ดอกเบี้ย (% ต่อปี แบบคงที่)', '2.5', attrs='min="0" step="any"')
             + '<label class="field"><span>จำนวนงวด</span><select id="months">'
             + ''.join(f'<option value="{n}"{" selected" if n == 60 else ""}>{n} งวด ({n // 12} ปี)</option>' for n in (12, 24, 36, 48, 60, 72, 84))
             + '</select></label></div>'
             + '<label class="check"><input id="vat" type="checkbox" checked> รวม VAT 7% ในค่างวด (สัญญาเช่าซื้อส่วนใหญ่)</label>',
        how="""<h2>สูตรคำนวณค่างวดรถแบบดอกเบี้ยคงที่ (Flat Rate)</h2>
<ol>
<li><code>ยอดจัด = ราคารถ − เงินดาวน์</code></li>
<li><code>ดอกเบี้ยทั้งหมด = ยอดจัด × อัตราดอกเบี้ย × จำนวนปี</code></li>
<li><code>ค่างวด = (ยอดจัด + ดอกเบี้ยทั้งหมด) ÷ จำนวนงวด</code></li>
<li>ถ้าสัญญาคิด VAT ให้คูณค่างวดด้วย 1.07</li>
</ol>
<p>ไฟแนนซ์รถในไทยส่วนใหญ่คิดดอกเบี้ยแบบคงที่ตลอดสัญญา ดอกเบี้ยจึงคิดจากยอดจัดเต็มจำนวนทุกปี ผ่อนนานขึ้นค่างวดต่อเดือนจะถูกลง แต่ดอกเบี้ยรวมจะมากขึ้น</p>""",
        faq=[
            ("ดาวน์เท่าไหร่ดี?", "ดาวน์มากขึ้นจะทำให้ยอดจัดและดอกเบี้ยรวมลดลง หลายไฟแนนซ์ให้ดอกเบี้ยต่ำลงเมื่อดาวน์ 25% ขึ้นไป"),
            ("ดอกเบี้ย 2.5% ต่อปีแบบ Flat Rate เท่ากับดอกเบี้ยจริงเท่าไหร่?", "ดอกเบี้ยแบบคงที่คิดจากเงินต้นเต็มจำนวนตลอดสัญญา ดอกเบี้ยจริงแบบลดต้นลดดอก (EIR) จะสูงกว่าประมาณ 1.8–1.9 เท่า"),
            ("ค่างวดนี้รวมประกันภัยหรือยัง?", "ยังไม่รวม ค่าประกันภัยรถยนต์ ภาษีรถประจำปี และค่าธรรมเนียมอื่นต้องจ่ายแยก"),
        ],
    ),
    dict(
        slug="home-loan",
        name="คำนวณผ่อนบ้าน",
        card="ค่างวดสินเชื่อบ้าน ดอกเบี้ยรวม รายได้ที่ควรมี",
        title="คำนวณผ่อนบ้าน ค่างวดสินเชื่อบ้าน คอนโด ต่อเดือน",
        desc="คำนวณค่างวดผ่อนบ้านและคอนโดแบบลดต้นลดดอก ใส่ยอดกู้ ดอกเบี้ย ระยะเวลา ดูดอกเบี้ยรวมและรายได้ขั้นต่ำที่ธนาคารต้องการ ใช้ฟรี",
        h1="คำนวณผ่อนบ้าน / คอนโด",
        lead="คำนวณค่างวดสินเชื่อบ้านแบบลดต้นลดดอก พร้อมดอกเบี้ยทั้งหมดและรายได้ที่ควรมีเพื่อให้ธนาคารอนุมัติ",
        form='<div class="grid2">'
             + f('loan', 'ยอดกู้ (บาท)', '2000000', attrs='min="0"')
             + f('rate', 'ดอกเบี้ยเฉลี่ย (% ต่อปี)', '5.5', attrs='min="0" step="any"')
             + f('years', 'ระยะเวลาผ่อน (ปี)', '30', attrs='min="1" max="40"')
             + '</div>',
        how="""<h2>สูตรคำนวณค่างวดแบบลดต้นลดดอก</h2>
<p><code>ค่างวด = ยอดกู้ × r ÷ (1 − (1 + r)<sup>−n</sup>)</code> โดย r คือดอกเบี้ยต่อเดือน (ดอกเบี้ยต่อปี ÷ 12) และ n คือจำนวนงวด</p>
<p>สินเชื่อบ้านคิดดอกเบี้ยจากเงินต้นคงเหลือ งวดแรกๆ ค่างวดส่วนใหญ่จึงไปตัดดอกเบี้ย ถ้าโปะเพิ่มในช่วงแรกจะช่วยประหยัดดอกเบี้ยได้มาก</p>
<p class="note">ธนาคารมักให้ดอกเบี้ยพิเศษ 3 ปีแรก แล้วลอยตัวตาม MRR ควรใช้ดอกเบี้ยเฉลี่ยตลอดสัญญาในการคำนวณ</p>""",
        faq=[
            ("เงินเดือนเท่าไหร่ถึงกู้บ้านได้?", "ธนาคารส่วนใหญ่ให้ภาระผ่อนหนี้ทั้งหมดไม่เกินประมาณ 40–50% ของรายได้ เครื่องมือนี้แสดงรายได้ขั้นต่ำโดยคิดที่ 40%"),
            ("กู้ได้กี่ปี?", "โดยทั่วไปสูงสุด 30–40 ปี และอายุผู้กู้รวมระยะกู้ต้องไม่เกินประมาณ 65–70 ปี ขึ้นกับธนาคาร"),
            ("ผ่อนเพิ่มทุกเดือนช่วยอะไร?", "เงินที่จ่ายเกินค่างวดจะไปตัดเงินต้นโดยตรง ทำให้ดอกเบี้ยงวดถัดไปลดลงและหมดหนี้เร็วขึ้น"),
        ],
    ),
    dict(
        slug="vat",
        name="คำนวณ VAT 7% และหัก ณ ที่จ่าย",
        card="บวก VAT / ถอด VAT / หักภาษี ณ ที่จ่าย 1–5%",
        title="คำนวณ VAT 7% ถอด VAT และภาษีหัก ณ ที่จ่าย 3%",
        desc="คำนวณภาษีมูลค่าเพิ่ม VAT 7% ทั้งบวก VAT และถอด VAT จากราคารวม พร้อมคำนวณภาษีหัก ณ ที่จ่าย 1% 2% 3% 5% และยอดโอนจริง ใช้ฟรี",
        h1="คำนวณ VAT 7% และภาษีหัก ณ ที่จ่าย",
        lead="บวก VAT เข้าราคาสินค้า หรือถอด VAT ออกจากราคารวม พร้อมคำนวณยอดโอนหลังหักภาษี ณ ที่จ่าย",
        form='<div class="seg">'
             + '<label class="radio"><input type="radio" name="mode" value="add" checked> ราคายังไม่รวม VAT (บวก VAT)</label>'
             + '<label class="radio"><input type="radio" name="mode" value="extract"> ราคารวม VAT แล้ว (ถอด VAT)</label>'
             + '</div><div class="grid2">'
             + f('amount', 'จำนวนเงิน (บาท)', '10000', attrs='min="0" step="any"')
             + f('rate', 'อัตรา VAT (%)', '7', attrs='min="0" step="any"')
             + '</div><label class="field"><span>หักภาษี ณ ที่จ่าย</span><select id="wht">'
             + '<option value="0">ไม่หัก</option><option value="1">1% (ค่าขนส่ง)</option><option value="2">2% (ค่าโฆษณา)</option>'
             + '<option value="3">3% (ค่าบริการ ค่าจ้างทำของ)</option><option value="5">5% (ค่าเช่า)</option></select></label>',
        how="""<h2>สูตรคำนวณ VAT</h2>
<ul>
<li><b>บวก VAT:</b> <code>ราคารวม = ราคาก่อน VAT × 1.07</code></li>
<li><b>ถอด VAT:</b> <code>ราคาก่อน VAT = ราคารวม ÷ 1.07</code> และ <code>VAT = ราคารวม − ราคาก่อน VAT</code></li>
<li><b>หัก ณ ที่จ่าย:</b> คิดจากราคาก่อน VAT เสมอ เช่น ค่าบริการ 10,000 บาท + VAT 700 − หัก 3% (300) = โอน 10,400 บาท</li>
</ul>
<p>ความผิดพลาดที่พบบ่อยคือถอด VAT ด้วยการคูณ 7% จากราคารวม ซึ่งจะได้ตัวเลขที่ผิด ต้องหารด้วย 1.07 แทน</p>""",
        faq=[
            ("ถอด VAT 7% คิดยังไง?", "นำราคารวมหารด้วย 1.07 จะได้ราคาก่อน VAT เช่น 1,070 ÷ 1.07 = 1,000 บาท VAT คือ 70 บาท"),
            ("หัก ณ ที่จ่าย 3% คิดจากยอดรวม VAT หรือไม่?", "ไม่ใช่ ภาษีหัก ณ ที่จ่ายคิดจากราคาก่อน VAT เท่านั้น"),
            ("ค่าบริการประเภทไหนหัก ณ ที่จ่ายกี่ %?", "โดยทั่วไป ค่าบริการและค่าจ้างทำของ 3% ค่าเช่า 5% ค่าโฆษณา 2% ค่าขนส่ง 1% ซึ่งหักเมื่อจ่ายให้นิติบุคคลหรือผู้ประกอบการตั้งแต่ 1,000 บาทขึ้นไป"),
        ],
    ),
    dict(
        slug="age",
        name="คำนวณอายุ",
        card="อายุกี่ปี กี่เดือน กี่วัน เกิดวันอะไร",
        title="คำนวณอายุ ปี เดือน วัน จากวันเกิด เกิดวันอะไร",
        desc="คำนวณอายุจากวันเดือนปีเกิดเป็นปี เดือน วัน ดูว่าเกิดวันอะไร มีชีวิตมากี่วัน และอีกกี่วันถึงวันเกิด รองรับ พ.ศ. ใช้ฟรี",
        h1="คำนวณอายุ",
        lead="เลือกวันเกิด ระบบบอกอายุเป็นปี เดือน วัน พร้อมบอกว่าเกิดวันอะไร และอีกกี่วันถึงวันเกิดครั้งถัดไป",
        form='<div class="grid2">'
             + f('birth', 'วันเดือนปีเกิด', '2000-01-01', type="date")
             + f('asof', 'คำนวณถึงวันที่', '', type="date", hint='ค่าเริ่มต้นคือวันนี้')
             + '</div>',
        how="""<h2>คำนวณอายุอย่างไร</h2>
<p>ระบบนับจำนวนปีเต็ม จากนั้นนับเดือนและวันที่เหลือ หากวันที่ของเดือนปัจจุบันยังไม่ถึงวันเกิด ระบบจะยืมจำนวนวันจากเดือนก่อนหน้ามาคิด เช่นเดียวกับการนับอายุในเอกสารราชการ</p>
<p>ปี พ.ศ. = ปี ค.ศ. + 543 เช่น ค.ศ. 2000 คือ พ.ศ. 2543</p>""",
        faq=[
            ("เกิดวันที่ 29 กุมภาพันธ์ นับวันเกิดอย่างไร?", "ในปีที่ไม่มีวันที่ 29 ก.พ. ระบบจะนับวันเกิดเป็นวันที่ 1 มีนาคม"),
            ("ใส่ปี พ.ศ. ได้ไหม?", "ช่องวันที่ใช้ปฏิทินของเครื่อง ถ้าเครื่องแสดงเป็น ค.ศ. ให้ลบ 543 จากปี พ.ศ. เช่น พ.ศ. 2540 = ค.ศ. 1997"),
            ("อายุนับแบบไหน?", "เป็นการนับอายุเต็มแบบสากล ไม่ใช่การนับอายุแบบบวกหนึ่งตามปีปฏิทิน"),
        ],
    ),
    dict(
        slug="days",
        name="นับวัน / บวกลบวันที่",
        card="ระหว่าง 2 วันห่างกันกี่วัน วันทำงานกี่วัน",
        title="นับวัน คำนวณจำนวนวันระหว่างวันที่ และวันทำงาน",
        desc="นับจำนวนวันระหว่างสองวันที่ แสดงเป็นปี เดือน วัน สัปดาห์ และวันทำงานจันทร์–ศุกร์ พร้อมบวกหรือลบวันจากวันที่ที่กำหนด ใช้ฟรี",
        h1="นับวัน คำนวณวันระหว่างวันที่",
        lead="หาว่าสองวันห่างกันกี่วัน มีวันทำงานกี่วัน หรือนับไปข้างหน้า/ย้อนหลังจากวันที่ที่ต้องการ",
        form='<h3>ระหว่างสองวันที่</h3><div class="grid2">'
             + f('start', 'วันเริ่มต้น', '', type="date")
             + f('end', 'วันสิ้นสุด', '', type="date")
             + '</div><label class="check"><input id="incl" type="checkbox"> นับรวมวันสุดท้ายด้วย (+1 วัน)</label>'
             + '<div class="result" id="result" aria-live="polite"></div>'
             + '<h3>บวก / ลบ วัน</h3><div class="grid2">'
             + f('base', 'จากวันที่', '', type="date")
             + f('n', 'จำนวนวัน (ใส่ติดลบเพื่อนับย้อนหลัง)', '90', attrs='step="1"')
             + '</div><div class="result" id="result2" aria-live="polite"></div>',
        result=False,
        how="""<h2>ใช้นับวันทำอะไรได้บ้าง</h2>
<ul>
<li>นับวันครบกำหนดสัญญา วันครบกำหนดชำระ หรือวันหมดอายุวีซ่า</li>
<li>นับวันลา วันทำงาน อายุงาน หรือวันครบทดลองงาน 119 วัน</li>
<li>นับถอยหลังถึงวันสอบ วันแต่งงาน หรือวันเดินทาง</li>
</ul>
<p>โดยปกติการนับระยะเวลาจะไม่รวมวันแรก ถ้าต้องการนับทั้งวันแรกและวันสุดท้าย (เช่น นับวันลา) ให้ติ๊ก “นับรวมวันสุดท้าย”</p>""",
        faq=[
            ("นับวันลาควรติ๊กนับรวมวันสุดท้ายไหม?", "ควรติ๊ก เพราะลาวันที่ 1 ถึง 3 คือ 3 วัน ไม่ใช่ 2 วัน"),
            ("วันทำงานหักวันหยุดราชการให้ไหม?", "ยังไม่หัก ระบบนับเฉพาะวันจันทร์ถึงศุกร์ ให้นำวันหยุดนักขัตฤกษ์ในช่วงนั้นไปลบเอง"),
            ("ทดลองงาน 119 วันครบวันไหน?", "ใช้ส่วน “บวก / ลบ วัน” ใส่วันเริ่มงานและจำนวน 118 วัน (วันเริ่มงานนับเป็นวันที่ 1)"),
        ],
    ),
    dict(
        slug="bmi",
        name="คำนวณ BMI",
        card="ดัชนีมวลกาย เกณฑ์คนเอเชีย น้ำหนักที่เหมาะสม",
        title="คำนวณ BMI ดัชนีมวลกาย เกณฑ์คนเอเชีย",
        desc="คำนวณค่า BMI หรือดัชนีมวลกายจากน้ำหนักและส่วนสูง ตามเกณฑ์คนเอเชีย บอกว่าผอม ปกติ ท้วม หรืออ้วน พร้อมน้ำหนักที่เหมาะสม ใช้ฟรี",
        h1="คำนวณ BMI (ดัชนีมวลกาย)",
        lead="กรอกน้ำหนักและส่วนสูง เพื่อดูค่า BMI และช่วงน้ำหนักที่เหมาะสมตามเกณฑ์สำหรับคนเอเชีย",
        form='<div class="grid2">'
             + f('weight', 'น้ำหนัก (กิโลกรัม)', '65', attrs='min="1" step="any"')
             + f('height', 'ส่วนสูง (เซนติเมตร)', '170', attrs='min="50" step="any"')
             + '</div>',
        how="""<h2>สูตร BMI และเกณฑ์สำหรับคนเอเชีย</h2>
<p><code>BMI = น้ำหนัก (กก.) ÷ ส่วนสูง (ม.)²</code> เช่น 65 ÷ (1.70 × 1.70) = 22.5</p>
<div class="tbl-wrap"><table><thead><tr><th>ค่า BMI</th><th>เกณฑ์</th></tr></thead><tbody>
<tr><td>ต่ำกว่า 18.5</td><td>น้ำหนักน้อย / ผอม</td></tr>
<tr><td>18.5 – 22.9</td><td>ปกติ</td></tr>
<tr><td>23 – 24.9</td><td>ท้วม / น้ำหนักเกิน</td></tr>
<tr><td>25 – 29.9</td><td>อ้วน</td></tr>
<tr><td>30 ขึ้นไป</td><td>อ้วนมาก</td></tr>
</tbody></table></div>
<p class="note">BMI ไม่แยกกล้ามเนื้อกับไขมัน นักกีฬาอาจมีค่า BMI สูงแม้ไม่อ้วน ไม่ควรใช้กับเด็ก หญิงตั้งครรภ์ และผู้สูงอายุ ใช้เพื่อประเมินเบื้องต้นเท่านั้น</p>""",
        faq=[
            ("BMI เท่าไหร่ถือว่าปกติ?", "สำหรับคนเอเชีย ค่า BMI ที่ปกติอยู่ระหว่าง 18.5 ถึง 22.9"),
            ("ทำไมเกณฑ์คนเอเชียต่ำกว่าฝั่งตะวันตก?", "งานวิจัยพบว่าคนเอเชียมีความเสี่ยงโรคเบาหวานและหัวใจที่ค่า BMI ต่ำกว่า องค์การอนามัยโลกจึงแนะนำเกณฑ์เฉพาะ"),
            ("ควรวัดรอบเอวด้วยไหม?", "ควร รอบเอวไม่ควรเกินส่วนสูงหารสอง เป็นตัวชี้วัดไขมันหน้าท้องที่ดีกว่า BMI"),
        ],
    ),
    dict(
        slug="discount",
        name="คำนวณส่วนลด / เปอร์เซ็นต์",
        card="ราคาหลังลด ลดซ้อน เพิ่มขึ้นลดลงกี่ %",
        title="คำนวณส่วนลด เปอร์เซ็นต์ ลดซ้อน และเปอร์เซ็นต์เพิ่มขึ้น",
        desc="คำนวณราคาหลังหักส่วนลด ลดซ้อน 2 ชั้น หาว่าเพิ่มขึ้นหรือลดลงกี่เปอร์เซ็นต์ และ X% ของจำนวนเงินเท่ากับเท่าไหร่ ใช้ฟรี",
        h1="คำนวณส่วนลดและเปอร์เซ็นต์",
        lead="หาราคาหลังลด รวมถึงลดซ้อน คำนวณเปอร์เซ็นต์เพิ่มขึ้น/ลดลง และหาค่าเปอร์เซ็นต์ของจำนวนใดๆ",
        form='<h3>ราคาหลังหักส่วนลด</h3><div class="grid2">'
             + f('price', 'ราคาเต็ม (บาท)', '1000', attrs='min="0" step="any"')
             + f('d1', 'ส่วนลด (%)', '20', attrs='min="0" max="100" step="any"')
             + f('d2', 'ลดซ้อนอีก (%)', '0', attrs='min="0" max="100" step="any"', hint='เช่น โค้ดส่วนลด หรือบัตรเครดิต')
             + '</div><div class="result" id="result" aria-live="polite"></div>'
             + '<h3>เพิ่มขึ้น / ลดลงกี่เปอร์เซ็นต์</h3><div class="grid2">'
             + f('from', 'ค่าเดิม', '100', attrs='step="any"')
             + f('to', 'ค่าใหม่', '120', attrs='step="any"')
             + '</div><div class="result" id="result2" aria-live="polite"></div>'
             + '<h3>X% ของจำนวนนี้เท่ากับเท่าไหร่</h3><div class="grid2">'
             + f('pct', 'เปอร์เซ็นต์ (%)', '15', attrs='step="any"')
             + f('of', 'ของจำนวน', '2500', attrs='step="any"')
             + '</div><div class="result" id="result3" aria-live="polite"></div>',
        result=False,
        how="""<h2>สูตรคำนวณเปอร์เซ็นต์ที่ใช้บ่อย</h2>
<ul>
<li><b>ราคาหลังลด:</b> <code>ราคา × (1 − ส่วนลด%)</code> เช่น 1,000 ลด 20% = 800 บาท</li>
<li><b>ลดซ้อน:</b> ลด 20% แล้วลดอีก 10% ไม่เท่ากับลด 30% แต่ = 1,000 × 0.8 × 0.9 = 720 บาท (ลดจริง 28%)</li>
<li><b>เปอร์เซ็นต์เปลี่ยนแปลง:</b> <code>(ค่าใหม่ − ค่าเดิม) ÷ ค่าเดิม × 100</code></li>
</ul>""",
        faq=[
            ("ลด 50% + 20% เท่ากับลด 70% ไหม?", "ไม่เท่า ส่วนลดชั้นที่สองคิดจากราคาที่ลดแล้ว จึงเท่ากับลดจริง 60%"),
            ("ขึ้นราคา 10% แล้วลด 10% ได้ราคาเดิมไหม?", "ไม่ได้ เช่น 100 ขึ้น 10% เป็น 110 แล้วลด 10% เหลือ 99"),
            ("หาเปอร์เซ็นต์กำไรคิดยังไง?", "ใส่ต้นทุนเป็นค่าเดิม และราคาขายเป็นค่าใหม่ ในส่วน “เพิ่มขึ้น / ลดลงกี่เปอร์เซ็นต์”"),
        ],
    ),
    dict(
        slug="gpa",
        name="คำนวณเกรดเฉลี่ย GPA",
        card="เกรดเฉลี่ยเทอม และ GPAX สะสม",
        title="คำนวณเกรดเฉลี่ย GPA และ GPAX สะสม",
        desc="คำนวณเกรดเฉลี่ย GPA ประจำภาคเรียนจากหน่วยกิตและเกรด A B+ B C+ C D+ D F พร้อมคำนวณเกรดเฉลี่ยสะสม GPAX ใช้ฟรี สำหรับนักเรียนนักศึกษา",
        h1="คำนวณเกรดเฉลี่ย (GPA / GPAX)",
        lead="ใส่หน่วยกิตและเกรดของแต่ละวิชา เพื่อดูเกรดเฉลี่ยเทอมนี้ และใส่เกรดสะสมเดิมเพื่อดู GPAX ใหม่",
        form='<div class="tbl-wrap"><table class="gpa-table"><thead><tr><th>วิชา</th><th>หน่วยกิต</th><th>เกรด</th><th></th></tr></thead>'
             + '<tbody id="courses"></tbody></table></div>'
             + '<div><button type="button" class="btn ghost" id="addRow">+ เพิ่มวิชา</button></div>'
             + '<fieldset><legend>เกรดสะสมเดิม (ไม่บังคับ)</legend><div class="grid2">'
             + f('prevGpa', 'GPAX เดิม', '', attrs='min="0" max="4" step="0.01" placeholder="เช่น 3.25"')
             + f('prevCr', 'หน่วยกิตสะสมเดิม', '', attrs='min="0" step="0.5" placeholder="เช่น 36"')
             + '</div></fieldset>',
        how="""<h2>วิธีคิดเกรดเฉลี่ย</h2>
<p><code>GPA = ผลรวม (หน่วยกิต × ค่าเกรด) ÷ ผลรวมหน่วยกิต</code></p>
<p>ค่าเกรด: A = 4, B+ = 3.5, B = 3, C+ = 2.5, C = 2, D+ = 1.5, D = 1, F = 0 ส่วนใหญ่ตัดทศนิยมเหลือ 2 ตำแหน่งโดยไม่ปัดขึ้น</p>
<p>GPAX (เกรดเฉลี่ยสะสม) คิดจากทุกวิชาที่เรียนมาทั้งหมด ไม่ใช่การเฉลี่ย GPA ของแต่ละเทอม</p>""",
        faq=[
            ("ทำไม GPAX ไม่เท่ากับค่าเฉลี่ย GPA ของทุกเทอม?", "เพราะแต่ละเทอมมีหน่วยกิตไม่เท่ากัน GPAX ต้องถ่วงน้ำหนักด้วยหน่วยกิต"),
            ("วิชาที่ได้ S/U หรือ P นับไหม?", "ไม่นับในเกรดเฉลี่ย ไม่ต้องใส่วิชานั้นในตาราง"),
            ("เกรดเท่าไหร่ถึงได้เกียรตินิยม?", "มหาวิทยาลัยส่วนใหญ่กำหนดเกียรตินิยมอันดับ 1 ที่ 3.50 ขึ้นไป และอันดับ 2 ที่ 3.25 ขึ้นไป โดยต้องไม่เคยได้ F หรือ D ตามเงื่อนไขของแต่ละสถาบัน"),
        ],
    ),
]


for _t, _c in {"baht-text": "text", "tax": "money", "car-loan": "home", "home-loan": "home", "vat": "money",
               "age": "date", "days": "date", "bmi": "health", "discount": "money", "gpa": "text"}.items():
    next(t for t in TOOLS if t["slug"] == _t)["cat"] = _c

from tools_more import TOOLS2  # noqa: E402
TOOLS += TOOLS2


# ------------------------------------------------------------------
def head(title, desc, canonical, root, extra_ld=()):
    ad = (f'<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client={ADSENSE_CLIENT}" '
          f'crossorigin="anonymous"></script>' if ADSENSE_CLIENT else '')
    verify = f'<meta name="google-site-verification" content="{html.escape(GOOGLE_VERIFY)}">' if GOOGLE_VERIFY else ''
    lds = ''.join(f'<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>' for ld in extra_ld)
    t, d = html.escape(title), html.escape(desc)
    return f"""<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{t}</title>
<meta name="description" content="{d}">
<link rel="canonical" href="{canonical}">
<meta property="og:type" content="website">
<meta property="og:title" content="{t}">
<meta property="og:description" content="{d}">
<meta property="og:url" content="{canonical}">
<meta property="og:site_name" content="{SITE_NAME}">
<meta property="og:locale" content="th_TH">
<meta name="theme-color" content="#0d6b5f">
{verify}
<link rel="icon" href="{FAVICON}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600&display=swap">
<link rel="stylesheet" href="{root}assets/style.css">
{ad}{lds}
</head>"""


def header(root):
    return (f'<header class="top"><div class="wrap"><a class="brand" href="{root}">{LOGO}{SITE_NAME}</a>'
            f'<nav><a href="{root}#tools">เครื่องมือทั้งหมด</a></nav></div></header>')


def footer(root):
    return (f'<footer><div class="wrap"><span>© {date.today().year + 543} {SITE_NAME} · {SITE_TAGLINE}</span>'
            f'<a href="{root}about/">เกี่ยวกับเรา</a><a href="{root}privacy/">นโยบายความเป็นส่วนตัว</a></div></footer>')


def tool_cards(root, tools=None):
    def card(t):
        b = f'<em class="badge">{t["badge"]}</em>' if t.get("badge") else ''
        return (f'<a class="tool" href="{root}{t["slug"]}/" data-k="{html.escape(t["title"].lower())}">'
                f'<strong>{t["name"]}{b}</strong><span>{t["card"]}</span></a>')
    return '<div class="tools">' + ''.join(card(t) for t in (TOOLS if tools is None else tools)) + '</div>'


def related(t, n=6):
    same = [x for x in TOOLS if x["cat"] == t["cat"] and x is not t]
    other = [x for x in TOOLS if x["cat"] != t["cat"] and x.get("badge")]
    return (same + other)[:n]


def write(rel, text):
    p = OUT / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding="utf-8")


def tool_page(t):
    root = "../"
    url = f'{SITE_URL}/{t["slug"]}/'
    ld = [
        {"@context": "https://schema.org", "@type": "WebApplication", "name": t["h1"], "url": url,
         "description": t["desc"], "applicationCategory": "UtilitiesApplication", "operatingSystem": "Any",
         "inLanguage": "th", "offers": {"@type": "Offer", "price": "0", "priceCurrency": "THB"}},
        {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
            {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in t["faq"]]},
        {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": SITE_NAME, "item": SITE_URL + "/"},
            {"@type": "ListItem", "position": 2, "name": t["name"], "item": url}]},
    ]
    result = '<div class="result" id="result" aria-live="polite"></div>' if t.get("result", True) else ''
    faq = ''.join(f'<details><summary>{q}</summary><p>{a}</p></details>' for q, a in t["faq"])
    body = f"""
<body data-tool="{t["slug"]}">
{header(root)}
<main class="wrap">
<nav class="crumb"><a href="{root}">{SITE_NAME}</a> › <a href="{root}#{t["cat"]}">{CATS[t["cat"]][0]}</a> › {t["name"]}</nav>
<h1>{t["h1"]}</h1>
<p class="lead">{t["lead"]}</p>
<form class="calc" novalidate autocomplete="off">
{t["form"]}
{result}
</form>
<section class="prose">{t["how"]}</section>
<section class="faq prose"><h2>คำถามที่พบบ่อย</h2>{faq}</section>
<section class="prose"><h2>เครื่องมือที่เกี่ยวข้อง</h2>{tool_cards(root, related(t))}
<p><a href="{root}#tools">ดูเครื่องมือทั้งหมด {len(TOOLS)} รายการ →</a></p></section>
</main>
{footer(root)}
{''.join(f'<script src="{s}" defer></script>' for s in t.get("scripts", []))}
<script src="{root}assets/app.js" defer></script>
<script src="{root}assets/more.js" defer></script>
</body>
</html>
"""
    write(f'{t["slug"]}/index.html', head(f'{t["title"]} | {SITE_NAME}', t["desc"], url, root, ld) + body)


def index_page():
    desc = (f"รวม {len(TOOLS)} เครื่องมือคำนวณภาษาไทย ใช้ฟรี: ภาษีเงินได้ ภาษีแม่ค้าออนไลน์ ค่างวดรถ ผ่อนบ้าน ค่าโอนบ้าน "
            "ค่าชาร์จรถ EV โซลาร์เซลล์ QR พร้อมเพย์ เงินชดเชย บำนาญประกันสังคม PM2.5 และอื่นๆ ใช้งานได้ทันทีบนมือถือ")
    ld = [{"@context": "https://schema.org", "@type": "WebSite", "name": SITE_NAME, "url": SITE_URL + "/", "inLanguage": "th"},
          {"@context": "https://schema.org", "@type": "ItemList", "itemListElement": [
              {"@type": "ListItem", "position": i + 1, "name": t["name"], "url": f'{SITE_URL}/{t["slug"]}/'}
              for i, t in enumerate(TOOLS)]}]
    icon = lambda k: (f'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" '
                      f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{CATS[k][2]}</svg>')
    chips = ''.join(f'<a class="chip" href="#{k}">{icon(k)}{v[0]}</a>' for k, v in CATS.items())
    hot = [t for t in TOOLS if t.get("badge")]
    sections = ''.join(
        f'<section class="cat-section" id="{k}"><div class="cat-head"><span class="cat-icon">{icon(k)}</span>'
        f'<div><h2>{v[0]}</h2><p>{v[1]}</p></div></div>{tool_cards("./", [t for t in TOOLS if t["cat"] == k])}</section>'
        for k, v in CATS.items())
    body = f"""
<body>
{header("./")}
<main class="wrap wide">
<section class="hero">
<p class="eyebrow">เครื่องมือคำนวณภาษาไทย · อัปเดต {date.today().year + 543}</p>
<h1>คำนวณเรื่องเงิน งาน บ้าน และสุขภาพ<br>ได้ในไม่กี่วินาที</h1>
<p>{len(TOOLS)} เครื่องมือที่คนไทยใช้บ่อย ตั้งแต่ภาษีเงินเดือน ค่างวดรถ ไปจนถึงค่าชาร์จรถ EV และค่าฝุ่น PM2.5 ใช้ฟรี ไม่ต้องสมัครสมาชิก</p>
<label class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>
<input id="toolSearch" type="search" placeholder="ค้นหาเครื่องมือ เช่น ภาษี, ผ่อนรถ, พร้อมเพย์" aria-label="ค้นหาเครื่องมือ"></label>
<ul class="trust"><li>ใช้ฟรีทั้งหมด</li><li>ไม่ต้องสมัครสมาชิก</li><li>ข้อมูลไม่ออกจากเครื่องคุณ</li><li>ใช้งานบนมือถือได้ดี</li></ul>
<nav class="chips" aria-label="หมวดหมู่">{chips}</nav>
</section>
<section class="cat-section hot"><div class="cat-head"><div><h2>มาแรงและใช้บ่อย</h2><p>เรื่องที่คนค้นหามากขึ้นในปีนี้</p></div></div>{tool_cards("./", hot)}</section>
<div id="tools">{sections}</div>
<p id="noResult" class="lead" hidden>ไม่พบเครื่องมือที่ค้นหา ลองใช้คำอื่น</p>
</main>
{footer("./")}
<script src="./assets/app.js" defer></script>
</body>
</html>
"""
    write("index.html", head(f"{SITE_NAME} – เครื่องมือคำนวณภาษาไทย ใช้ฟรี", desc, SITE_URL + "/", "./", ld) + body)


def simple_page(slug, title, content):
    root = "../"
    body = f"""
<body>
{header(root)}
<main class="wrap prose">
<nav class="crumb"><a href="{root}">{SITE_NAME}</a> › {title}</nav>
<h1>{title}</h1>
{content}
</main>
{footer(root)}
</body>
</html>
"""
    write(f"{slug}/index.html", head(f"{title} | {SITE_NAME}", f"{title} ของเว็บไซต์ {SITE_NAME}", f"{SITE_URL}/{slug}/", root) + body)


def static_pages():
    contact = f'<p>ติดต่อ: <a href="mailto:{CONTACT_EMAIL}">{CONTACT_EMAIL}</a></p>' if CONTACT_EMAIL else ''
    simple_page("about", "เกี่ยวกับเรา", f"""
<p>{SITE_NAME} รวบรวมเครื่องมือคำนวณที่คนไทยใช้บ่อยในชีวิตประจำวันไว้ในที่เดียว ทั้งเรื่องเงิน ภาษี สินเชื่อ วันที่ และสุขภาพ
ออกแบบให้ใช้งานง่ายบนมือถือ และคำนวณได้ทันทีโดยไม่ต้องสมัครสมาชิก</p>
<p>การคำนวณทั้งหมดทำงานในเบราว์เซอร์ของคุณ ข้อมูลที่กรอกจะไม่ถูกส่งไปยังเซิร์ฟเวอร์ใดๆ</p>
<p>ผลลัพธ์มีไว้เพื่อการประมาณและวางแผนเบื้องต้น สำหรับการตัดสินใจทางการเงินหรือภาษีที่สำคัญ โปรดตรวจสอบกับหน่วยงานหรือผู้เชี่ยวชาญที่เกี่ยวข้อง</p>
{contact}""")
    simple_page("privacy", "นโยบายความเป็นส่วนตัว", f"""
<p>ปรับปรุงล่าสุด: {TODAY}</p>
<h2>ข้อมูลที่คุณกรอก</h2>
<p>ตัวเลขและวันที่ที่คุณกรอกในเครื่องมือคำนวณ ประมวลผลในเบราว์เซอร์ของคุณเท่านั้น เราไม่เก็บ ไม่บันทึก และไม่ส่งข้อมูลเหล่านี้ไปที่ใด</p>
<h2>คุกกี้และโฆษณา</h2>
<p>เว็บไซต์นี้อาจแสดงโฆษณาจากผู้ให้บริการภายนอก รวมถึง Google ซึ่งใช้คุกกี้เพื่อแสดงโฆษณาตามการเข้าชมเว็บไซต์นี้และเว็บไซต์อื่นของคุณ
คุกกี้ DoubleClick ช่วยให้ Google และพาร์ทเนอร์แสดงโฆษณาที่เกี่ยวข้องกับคุณได้</p>
<p>คุณสามารถเลือกไม่รับโฆษณาที่ปรับตามความสนใจได้ที่ <a href="https://adssettings.google.com" rel="nofollow">การตั้งค่าโฆษณาของ Google</a>
และศึกษาวิธีที่ Google ใช้ข้อมูลได้ที่ <a href="https://policies.google.com/technologies/partner-sites" rel="nofollow">นโยบายของ Google</a></p>
<h2>ลิงก์ภายนอก</h2>
<p>เว็บไซต์นี้อาจมีลิงก์ไปยังเว็บไซต์อื่น ซึ่งมีนโยบายความเป็นส่วนตัวของตนเอง</p>
{contact}""")


def seo_files():
    urls = [SITE_URL + "/"] + [f'{SITE_URL}/{t["slug"]}/' for t in TOOLS] + [f"{SITE_URL}/about/", f"{SITE_URL}/privacy/"]
    sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    sm += ''.join(f"  <url><loc>{u}</loc><lastmod>{TODAY}</lastmod></url>\n" for u in urls) + '</urlset>\n'
    write("sitemap.xml", sm)
    write("robots.txt", f"User-agent: *\nAllow: /\n\nSitemap: {SITE_URL}/sitemap.xml\n")
    if ADSENSE_CLIENT:
        write("ads.txt", f"google.com, {ADSENSE_CLIENT.replace('ca-', '')}, DIRECT, f08c47fec0942fa0\n")
    write(".nojekyll", "")
    write("404.html", head(f"ไม่พบหน้านี้ | {SITE_NAME}", "ไม่พบหน้าที่ต้องการ", SITE_URL + "/", SITE_URL + "/") +
          f'<body>{header(SITE_URL + "/")}<main class="wrap"><h1>ไม่พบหน้านี้</h1>'
          f'<p class="lead">ลองเลือกเครื่องมือด้านล่าง</p>{tool_cards(SITE_URL + "/")}</main></body></html>')


def main():
    if OUT.exists():
        shutil.rmtree(OUT)
    shutil.copytree(ROOT / "src" / "assets", OUT / "assets")
    # ไฟล์ที่ต้องอยู่ที่ root ของเว็บตามเดิม เช่น ไฟล์ยืนยัน Google Search Console
    shutil.copytree(ROOT / "static", OUT, dirs_exist_ok=True)
    index_page()
    for t in TOOLS:
        tool_page(t)
    static_pages()
    seo_files()
    n = sum(1 for _ in OUT.rglob("*.html"))
    print(f"สร้างเสร็จ {n} หน้า -> {OUT}")
    if not ADSENSE_CLIENT:
        print("หมายเหตุ: ยังไม่ได้ใส่ ADSENSE_CLIENT จึงยังไม่มีโฆษณา")


if __name__ == "__main__":
    main()
