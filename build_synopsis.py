from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.enum.section import WD_SECTION
from pathlib import Path


OUT = Path(__file__).parent / "deliverables" / "WayFinder_Project_Synopsis.docx"
OUT.parent.mkdir(parents=True, exist_ok=True)

doc = Document()
sec = doc.sections[0]
sec.page_width = Inches(8.27)
sec.page_height = Inches(11.69)
sec.top_margin = Inches(0.66)
sec.bottom_margin = Inches(0.65)
sec.left_margin = Inches(0.75)
sec.right_margin = Inches(0.75)
sec.header_distance = Inches(0.3)
sec.footer_distance = Inches(0.3)
sec.different_first_page_header_footer = True

# Match the supplied institute cover with a double frame on its first page only.
sect_pr = sec._sectPr
page_borders = OxmlElement("w:pgBorders")
page_borders.set(qn("w:offsetFrom"), "page")
page_borders.set(qn("w:display"), "firstPage")
for edge in ("top", "left", "bottom", "right"):
    border = OxmlElement("w:" + edge)
    border.set(qn("w:val"), "double")
    border.set(qn("w:sz"), "12")
    border.set(qn("w:space"), "16")
    border.set(qn("w:color"), "111111")
    page_borders.append(border)
sect_pr.append(page_borders)

NAVY = "17365D"
BLUE = "2F75B5"
PALE = "EAF2F8"
GRAY = "5A6470"
INK = "202833"

styles = doc.styles
normal = styles["Normal"]
normal.font.name = "Calibri"
normal.font.size = Pt(10.4)
normal.font.color.rgb = RGBColor.from_string(INK)
normal.paragraph_format.space_after = Pt(5)
normal.paragraph_format.line_spacing = 1.08
for stylename, size, color in [("Title", 28, NAVY), ("Heading 1", 19, NAVY), ("Heading 2", 12, BLUE), ("Heading 3", 10.5, NAVY)]:
    st = styles[stylename]
    st.font.name = "Calibri"
    st.font.size = Pt(size)
    st.font.bold = True
    st.font.color.rgb = RGBColor.from_string(color)
    st.paragraph_format.keep_with_next = True
    st.paragraph_format.space_before = Pt(5 if stylename != "Title" else 0)
    st.paragraph_format.space_after = Pt(5)


def set_cell_shading(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), fill)
    tc_pr.append(shd)


def set_cell_margins(cell, top=80, start=110, bottom=80, end=110):
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    tc_mar = tc_pr.first_child_found_in("w:tcMar")
    if tc_mar is None:
        tc_mar = OxmlElement("w:tcMar")
        tc_pr.append(tc_mar)
    for m, v in [("top", top), ("start", start), ("bottom", bottom), ("end", end)]:
        node = tc_mar.find(qn("w:" + m))
        if node is None:
            node = OxmlElement("w:" + m)
            tc_mar.append(node)
        node.set(qn("w:w"), str(v))
        node.set(qn("w:type"), "dxa")


def set_cell_border(cell, color=BLUE, size="8"):
    tc_pr = cell._tc.get_or_add_tcPr()
    borders = tc_pr.first_child_found_in("w:tcBorders")
    if borders is None:
        borders = OxmlElement("w:tcBorders")
        tc_pr.append(borders)
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        tag = "w:" + edge
        element = borders.find(qn(tag))
        if element is None:
            element = OxmlElement(tag)
            borders.append(element)
        element.set(qn("w:val"), "single")
        element.set(qn("w:sz"), size)
        element.set(qn("w:color"), color)


def page_heading(title, kicker=None):
    if kicker:
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(2)
        r = p.add_run(kicker.upper())
        r.bold = True
        r.font.size = Pt(8)
        r.font.color.rgb = RGBColor.from_string(BLUE)
    doc.add_heading(title, level=1)


def para(text, bold_lead=None):
    p = doc.add_paragraph()
    if bold_lead and text.startswith(bold_lead):
        p.add_run(bold_lead).bold = True
        p.add_run(text[len(bold_lead):])
    else:
        p.add_run(text)
    return p


def bullet(text, level=0):
    p = doc.add_paragraph(style="List Bullet" if level == 0 else "List Bullet 2")
    p.paragraph_format.left_indent = Inches(0.23 + level * 0.2)
    p.paragraph_format.first_line_indent = Inches(-0.14)
    p.paragraph_format.space_after = Pt(2)
    p.add_run(text)
    return p


def numbered(text):
    p = doc.add_paragraph(style="List Number")
    p.paragraph_format.space_after = Pt(3)
    p.add_run(text)
    return p


def note_box(label, text):
    t = doc.add_table(rows=1, cols=1)
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = t.cell(0, 0)
    set_cell_shading(cell, PALE)
    set_cell_border(cell, color="9BBAD4", size="6")
    set_cell_margins(cell, 100, 150, 100, 150)
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(0)
    r = p.add_run(label + "  ")
    r.bold = True
    r.font.color.rgb = RGBColor.from_string(NAVY)
    p.add_run(text)
    doc.add_paragraph().paragraph_format.space_after = Pt(0)


def diagram_box(text, fill=PALE, font_size=9.0):
    t = doc.add_table(rows=1, cols=1)
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    t.autofit = False
    t.columns[0].width = Inches(5.7)
    c = t.cell(0, 0)
    c.width = Inches(5.7)
    c.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
    set_cell_shading(c, fill)
    set_cell_border(c, color=BLUE, size="8")
    set_cell_margins(c, 55, 110, 55, 110)
    p = c.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(0)
    r = p.add_run(text)
    r.bold = True
    r.font.size = Pt(font_size)
    r.font.color.rgb = RGBColor.from_string(NAVY)
    return t


def arrow(label="↓"):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.space_before = Pt(0)
    r = p.add_run(label)
    r.bold = True
    r.font.size = Pt(11)
    r.font.color.rgb = RGBColor.from_string(BLUE)


def page_break():
    doc.add_page_break()


# Running header/footer
header = sec.header.paragraphs[0]
header.alignment = WD_ALIGN_PARAGRAPH.RIGHT
hr = header.add_run("WAYFINDER  |  PROJECT SYNOPSIS")
hr.font.name = "Calibri"
hr.font.size = Pt(8)
hr.font.bold = True
hr.font.color.rgb = RGBColor.from_string(GRAY)
footer = sec.footer.paragraphs[0]
footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
fr = footer.add_run("WayFinder – Campus Navigation Guide     •     ")
fr.font.size = Pt(8)
fr.font.color.rgb = RGBColor.from_string(GRAY)
fld = OxmlElement("w:fldSimple")
fld.set(qn("w:instr"), "PAGE")
footer._p.append(fld)


# PAGE 1 — Institution cover adapted from the supplied certificate page.
p = doc.add_paragraph()
p.paragraph_format.space_before = Pt(7)
p.paragraph_format.space_after = Pt(16)
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = p.add_run("Academic Year : 2026-2027")
r.bold = True
r.font.size = Pt(14)
r.font.color.rgb = RGBColor.from_string(INK)

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.space_after = Pt(5)
r = p.add_run("Dr. Vasantraodada Patil Shetkari Shikshan Mandal's Padmabhushan")
r.bold = True
r.font.size = Pt(13)
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.space_after = Pt(15)
r = p.add_run("Vasantraodada Patil Institute of Technology")
r.bold = True
r.font.size = Pt(14)
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.space_after = Pt(12)
r = p.add_run("Department of Computer Science Engineering")
r.bold = True
r.font.size = Pt(14)

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.space_after = Pt(12)
p.add_run().add_picture(str(Path(__file__).parent / "deliverables" / "assets" / "institute_emblem.png"), width=Inches(1.55))

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.space_after = Pt(5)
r = p.add_run("CERTIFICATE")
r.bold = True
r.font.size = Pt(24)
r.font.color.rgb = RGBColor.from_string(INK)
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.space_after = Pt(4)
r = p.add_run("This is to certify that the project synopsis entitled")
r.font.size = Pt(11)
r.font.color.rgb = RGBColor.from_string(INK)
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.space_after = Pt(5)
r = p.add_run("WAYFINDER - CAMPUS NAVIGATION GUIDE")
r.bold = True
r.font.size = Pt(18)
r.font.color.rgb = RGBColor.from_string(BLUE)
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.space_after = Pt(5)
r = p.add_run("is submitted by the following students")
r.bold = True
r.font.size = Pt(14)

cover_table = doc.add_table(rows=2, cols=3)
cover_table.alignment = WD_TABLE_ALIGNMENT.CENTER
cover_table.autofit = False
for cell, label in zip(cover_table.rows[0].cells, ["NAME", "PRN NO", "ROLL NO"]):
    cell.width = Inches(2.05)
    cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
    set_cell_margins(cell, 105, 90, 105, 90)
    set_cell_border(cell, color="555555", size="8")
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(0)
    r = p.add_run(label)
    r.bold = True
    r.font.size = Pt(11)
for cell in cover_table.rows[1].cells:
    cell.width = Inches(2.05)
    cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
    set_cell_margins(cell, 220, 90, 220, 90)
    set_cell_border(cell, color="555555", size="8")
    cell.paragraphs[0].paragraph_format.space_after = Pt(0)

p = doc.add_paragraph()
p.paragraph_format.space_before = Pt(46)
p.paragraph_format.space_after = Pt(0)
signature_table = doc.add_table(rows=1, cols=3)
signature_table.alignment = WD_TABLE_ALIGNMENT.CENTER
signature_table.autofit = False
for cell, (role, name) in zip(signature_table.rows[0].cells, [
    ("Incharge", "Mrs. P.S. Patil"),
    ("H.O.D", "Mr. A.B. Jagadale"),
    ("Principal", "Dr. S.S. Mohite"),
]):
    cell.width = Inches(2.05)
    cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
    set_cell_margins(cell, 0, 50, 0, 50)
    tc_pr = cell._tc.get_or_add_tcPr()
    borders = OxmlElement("w:tcBorders")
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        border = OxmlElement("w:" + edge)
        border.set(qn("w:val"), "nil")
        borders.append(border)
    tc_pr.append(borders)
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(0)
    r = p.add_run(role + "\n")
    r.bold = True
    r.font.size = Pt(11)
    r = p.add_run(name)
    r.font.size = Pt(10)


# PAGE 2 — Abstract and contents
page_break()
page_heading("Synopsis Overview", "WayFinder at a glance")
doc.add_heading("Abstract", level=2)
para("Finding a particular building on a college campus can be difficult for newly admitted students, parents, faculty members, and other visitors. A campus may contain academic blocks, hostels, offices, food facilities, recreation areas, and multiple pedestrian paths, while signs and informal directions may be incomplete or unfamiliar to a first-time visitor. WayFinder proposes a lightweight web application that brings campus place discovery and walking directions into one interface.")
para("The application combines a React single-page frontend with a FastAPI backend and an SQLite data store. Users can search and filter a directory of campus locations, view markers on an OpenStreetMap-based Leaflet map, inspect location details, and select a source and destination. For navigation, the backend represents walkable paths as a weighted graph. It maps selected coordinates to nearby graph nodes, applies Dijkstra’s shortest-path algorithm using path distance as the edge weight, and returns route coordinates, total estimated distance, estimated walking time, and simple turn instructions. Contact-form submissions are stored in the database.")
para("This synopsis describes the current student-project prototype and its development method. The sample graph and coordinates are illustrative campus data and must be checked against a real campus survey before operational use. Walking time is an estimate based on an assumed speed, and the prototype does not claim live positioning, indoor navigation, accessibility validation, or a surveyed pedestrian network. Expected outcomes are therefore functional demonstration outcomes, not measured user-study results.")
doc.add_heading("Keywords", level=2)
para("Campus wayfinding; web mapping; OpenStreetMap; React; FastAPI; SQLite; Dijkstra’s algorithm; pedestrian routing.")
doc.add_heading("Contents", level=2)
for item in [
    "1. Introduction", "2. Literature Survey", "3. Problem Statement", "4. Objectives",
    "5. Methodology", "6. Proposed System", "7. Future Scope", "8. Conclusion", "9. References",
]:
    bullet(item)


# PAGE 3 — Introduction
page_break()
page_heading("1. Introduction", "Context and motivation")
doc.add_heading("1.1 Background", level=2)
para("A college campus functions like a small, familiar-to-regulars but unfamiliar-to-visitors environment. Important destinations are distributed across a network of paths and buildings. A person may know the name of a department or service but not its location, the nearest entrance, or the route that avoids unnecessary walking. This creates friction during admissions, examinations, events, appointments, and the first weeks of a new academic term.")
para("Digital maps can make spatial information easier to access, but general-purpose maps do not always expose the campus-specific directory and path knowledge a visitor needs. A useful campus guide should connect a searchable place catalogue with a map and make the next action understandable. In this project, a location is represented by its name, category, coordinates, description, image reference, and opening-hours text. The map provides spatial context, while route instructions translate a computed path into short phrases such as “Go straight for … metres” or “Turn left at …”.")
doc.add_heading("1.2 Project concept", level=2)
para("WayFinder is a responsive web application for discovering and navigating to selected campus places. The homepage introduces the service and highlights popular locations. Search and category filters narrow the place list; selecting a result opens its details or focuses it on the map. The navigation interface accepts a source and destination, requests a route from the backend, and visualises the returned coordinate sequence as a polyline. Distance and walking-time estimates accompany the route instructions.")
para("The technical design separates the interface, API, routing logic, and stored data. React, React Router, Axios, and React Leaflet form the browser interface. FastAPI exposes REST endpoints, SQLAlchemy maps application records to SQLite tables, and Leaflet displays map layers and route geometry. OpenStreetMap supplies the displayed basemap, subject to its attribution and usage requirements [7], [8].")
doc.add_heading("1.3 Importance and scope", level=2)
para("The project is important as a practical demonstration of how web development, databases, mapping, graph theory, and human-centred information design can work together. It offers visitors one starting point for finding campus facilities and demonstrates a graph-based approach to walking directions. The current version is a prototype for a single sample campus: location coordinates and path edges need local verification. It is not a replacement for emergency signage, campus security instructions, or a professionally surveyed accessible routing service.")


# PAGE 4 — Literature survey
page_break()
page_heading("2. Literature Survey", "Prior work and existing approaches")
doc.add_heading("2.1 Digital campus wayfinding", level=2)
para("University wayfinding research spans online directories, mobile navigation, indoor mapping, and context-aware systems. A campus application must represent both destinations and the connections between them. A directory answers “what is here?”; a map answers “where is it?”; a routing service answers “how can I get there?” These functions are related but require different data and interaction choices.")
doc.add_heading("2.2 Event-driven campus navigation", level=2)
para("The IEEE Xplore work titled “An event-driven university campus navigation system on android platform” describes a mobile approach to campus navigation [2]. Its mobile-platform framing is relevant because visitors often need directions while moving around campus. Compared with a native mobile application, WayFinder uses a browser-based interface that can be opened from a shared link without first installing an app. The trade-off is that a web prototype has fewer built-in device capabilities and does not automatically provide reliable live-position tracking.")
doc.add_heading("2.3 Augmented-reality and indoor navigation", level=2)
para("An IEEE study on an augmented-reality-based indoor positioning navigation tool explores image-processing and augmented-reality guidance for a building environment [3]. Such techniques can provide visual cues when satellite positioning is weak indoors, but they require device camera interaction and carefully prepared indoor references. WayFinder focuses first on a simpler two-dimensional outdoor campus map, which is easier to explain and maintain for a small student prototype. Indoor room-level guidance remains a potential extension rather than a current capability.")
doc.add_heading("2.4 Accessibility-oriented guidance", level=2)
para("GuideBeacon investigates beacon-based indoor wayfinding for people who are blind, visually impaired, or disoriented [4]. Another campus-navigation study addresses blind, hearing-impaired, and visually impaired users in the ITU Ayazaga campus context [5]. These works highlight that navigation is not only a geometry problem: guidance must be perceivable, safe, and appropriate to the user. WayFinder’s current text directions and visual map form a baseline, but they have not been validated with assistive-technology users and do not yet model curb ramps, stairs, surface quality, or accessible entrances.")
doc.add_heading("2.5 Implication for the project", level=2)
para("The literature suggests a sensible staged design: begin with reliable place data and outdoor paths, return explainable directions, and treat accessibility and indoor positioning as explicit data and testing requirements. This project adopts that bounded first step, while documenting what a future campus survey and user evaluation would need to add.")


# PAGE 5 — Survey synthesis
page_break()
page_heading("2. Literature Survey Comparison", "Comparison and research gap")
rows = [
    ["Approach / reference", "Strength reported or implied", "Design implication for WayFinder"],
    ["Mobile, event-driven campus navigation [2]", "Campus-focused mobile access and navigation workflow", "Offer campus-specific POIs in a browser-first interface; avoid claiming native mobile features"],
    ["AR indoor positioning [3]", "Visual, context-aware indoor guidance", "Keep first release to mapped outdoor paths; indoor guidance needs a separate positioning method"],
    ["GuideBeacon indoor wayfinding [4]", "Beacon-based assistance for users who can become disoriented", "Treat accessible instructions and user testing as important future work"],
    ["Campus multimodal navigation [5]", "Considers differing sensory needs in a campus context", "Do not equate a visible route line with inclusive navigation"],
    ["3D university mapping with NavMesh/A* [6]", "Detailed spatial representation and indoor route planning", "A 2D graph is simpler and explainable for an initial prototype; more detailed maps add data and maintenance cost"],
    ["MazeMap campus study [7]", "Examines deployed indoor mapping and mobility in university settings", "Campus mapping benefits from maintained, institution-specific spatial data"],
]
t = doc.add_table(rows=len(rows), cols=3)
t.alignment = WD_TABLE_ALIGNMENT.CENTER
t.autofit = False
widths = [1.52, 2.16, 2.85]
for ri, row in enumerate(rows):
    for ci, value in enumerate(row):
        c = t.cell(ri, ci)
        c.width = Inches(widths[ci])
        c.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
        set_cell_margins(c, 65, 75, 65, 75)
        set_cell_border(c, color="B6C9D9", size="4")
        if ri == 0:
            set_cell_shading(c, NAVY)
        elif ri % 2 == 0:
            set_cell_shading(c, "F3F7FA")
        p = c.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.0
        r = p.add_run(value)
        r.font.size = Pt(8.1 if ri else 8.3)
        if ri == 0:
            r.bold = True
            r.font.color.rgb = RGBColor(255, 255, 255)
        else:
            r.font.color.rgb = RGBColor.from_string(INK)
doc.add_paragraph()
doc.add_heading("2.6 Research gap and project position", level=2)
para("Many advanced systems rely on technologies such as indoor positioning, beacons, augmented reality, 3D models, or detailed institutional datasets. These approaches can be powerful, but they require additional infrastructure, data collection, device support, and ongoing maintenance. A small academic prototype benefits from a transparent, low-cost baseline that can be demonstrated and incrementally improved.")
para("WayFinder’s contribution is an integrated and explainable prototype: a structured place catalogue, name/category search, interactive map, campus walking graph, Dijkstra shortest-distance computation, basic text directions, and contact-message storage. Its main gap is also clear: the sample graph is not yet an authoritative pedestrian network. A real deployment would require campus validation, route-safety review, accessible-path attributes, and testing with intended users. The project therefore demonstrates a method and working architecture, not a claim of superiority over the specialist systems reviewed.")
note_box("Review basis", "The comparison summarises the cited systems at a high level. The synopsis uses publisher and project documentation for factual details; full-text access and campus-specific validation should be completed before formal research claims are made.")


# PAGE 6 — Problem statement
page_break()
page_heading("3. Problem Statement", "Need, scope, and assumptions")
doc.add_heading("3.1 Problem definition", level=2)
para("New students, parents, faculty members, and visitors may not know where important campus facilities are located or how to walk between them. Information may be distributed across signs, printed maps, websites, or informal directions. When a visitor knows a destination name but not its location, the lack of a unified, searchable, map-based guide can cause confusion, repeated enquiries, and avoidable walking.")
para("The project addresses the following problem: how can a visitor use a simple web interface to find a named campus place and receive an understandable walking route between two selected campus points, using a maintainable dataset and a transparent shortest-path method?")
doc.add_heading("3.2 Specific difficulties", level=2)
for item in [
    "Visitors may not know the official name, category, or position of a facility.",
    "A list of destinations without map context does not show spatial relationships.",
    "A straight line between two coordinates may cross buildings or areas without a pedestrian path.",
    "A route line alone does not communicate distance, approximate time, or the next turn.",
    "Location details and contact feedback need a simple data-backed interface.",
]:
    bullet(item)
doc.add_heading("3.3 Scope", level=2)
para("The prototype includes a campus location catalogue, category and text search, map markers and popups, location detail pages, a graph-based walking route response, estimated distance/time, written turn guidance, toast feedback, and a contact form stored through the backend. The browser uses React and Leaflet; the service layer uses FastAPI and SQLAlchemy; SQLite is used for the sample deployment.")
doc.add_heading("3.4 Assumptions and limitations", level=2)
para("The route graph contains a finite set of manually supplied pedestrian junctions and edges. Each edge is weighted by geographic distance between its endpoints. Selected source and destination points are attached to their nearest graph nodes; the current implementation rejects a point more than 500 metres from the mapped graph. The algorithm minimises total distance within this graph; it cannot find a path that was omitted from the graph. Walking time is estimated using an assumed rate of 80 metres per minute and rounded up to whole minutes. Neither the rate nor the graph has been validated by a campus-wide field study. The prototype does not track the user’s live location, reroute dynamically, or guarantee step-free or safe access.")
note_box("Engineering interpretation", "Dijkstra returns the shortest path only relative to the graph and edge weights supplied. Accurate directions therefore depend first on accurate campus paths, coordinates, and route attributes.")


# PAGE 7 — Objectives
page_break()
page_heading("4. Objectives", "What the project intends to achieve")
doc.add_heading("4.1 Primary objective", level=2)
para("To design and implement a responsive web-based campus navigation guide that helps a user discover campus locations and obtain an understandable shortest-distance walking route between selected points on a mapped pedestrian graph.")
doc.add_heading("4.2 Specific objectives", level=2)
numbered("Create a structured location catalogue containing each place’s name, category, latitude, longitude, description, image reference, and opening-hours text.")
numbered("Provide a simple responsive interface with navigation between Home, Map, Location Details, About, and Contact views, including a custom not-found page.")
numbered("Allow users to search location names, filter by category, and inspect matching places through cards, details, and map markers.")
numbered("Display campus places on an OpenStreetMap-based Leaflet map with marker popups and route geometry.")
numbered("Represent pedestrian paths as a weighted graph and apply Dijkstra’s algorithm to select the minimum-distance path between the nearest connected access nodes.")
numbered("Return a route polyline, distance estimate, walking-time estimate, and simple turn-by-turn text from the route API.")
numbered("Validate API input and provide clear success/error feedback; store submitted contact messages in SQLite.")
numbered("Keep the implementation modular and explainable so it can be demonstrated, tested, and extended by a student team.")
doc.add_heading("4.3 Demonstration acceptance checks", level=2)
para("The project can be demonstrated against observable checks rather than invented performance results: (i) a known location can be found by name or category; (ii) selecting a marker shows the location identity; (iii) a connected source/destination pair returns a route whose map line follows graph nodes rather than a single straight segment; (iv) the response includes non-negative distance and a positive estimated time; (v) directions begin and end with clear guidance; and (vi) a valid contact form submission appears in the database. These checks confirm functional behaviour, not route accuracy or user satisfaction.")
doc.add_heading("4.4 Expected academic value", level=2)
para("The work provides an applied exercise in full-stack development, REST API design, relational data modelling, map visualisation, graph representation, shortest-path algorithms, input validation, and technical documentation. It also creates a concrete foundation for later evaluation with real campus paths and users.")


# PAGE 8 — Methodology flow
page_break()
page_heading("5. Methodology", "Development process and flowchart")
doc.add_heading("5.1 Development method", level=2)
para("The project follows an incremental, prototype-oriented development process. Requirements are translated into user tasks, the data model and route graph are designed, frontend and backend modules are implemented, and the integrated system is checked against representative use cases. Separating the place catalogue from the routing graph allows the project to maintain location records and path topology as related but distinct data.")
doc.add_heading("5.2 Application workflow", level=2)
para("The following flowchart summarises the normal user journey and API interaction. It is an editable Word table diagram and represents the current prototype workflow.")
diagram_box("START — Open WayFinder in a browser", fill="DCEAF5")
arrow()
diagram_box("Load the interface; request locations and categories from FastAPI")
arrow()
diagram_box("Search or filter places → select source and destination")
arrow()
diagram_box("Are both selections valid and within the mapped campus network?", fill="FFF2CC")
branch = doc.add_table(rows=1, cols=2)
branch.alignment = WD_TABLE_ALIGNMENT.CENTER
branch.autofit = False
for idx, (label, content, fill) in enumerate([
    ("NO", "Show validation / not-found message; let the user revise the selection", "FCE4D6"),
    ("YES", "POST the coordinates to the route API", "E2F0D9"),
]):
    c = branch.cell(0, idx)
    c.width = Inches(2.78)
    set_cell_shading(c, fill)
    set_cell_border(c, color="9BBAD4", size="6")
    set_cell_margins(c, 55, 75, 55, 75)
    p = c.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(0)
    r = p.add_run(label + "  ")
    r.bold = True
    r.font.size = Pt(8.5)
    r.font.color.rgb = RGBColor.from_string(NAVY)
    rr = p.add_run(content)
    rr.font.size = Pt(8.1)
arrow("YES ↓")
diagram_box("Backend maps access points to graph nodes → runs Dijkstra → builds route and instructions")
arrow()
diagram_box("Return route points, total distance, estimated walking time, and directions")
arrow()
diagram_box("Display the polyline and guidance; user follows route / chooses another destination", fill="DCEAF5")
arrow("↓")
diagram_box("END", fill="DCEAF5")
doc.add_heading("5.3 Implementation stages", level=2)
para("The staged workflow is: (1) identify user and system requirements; (2) prepare sample places and pedestrian connections; (3) define SQLAlchemy entities and REST schemas; (4) implement search, location, contact, and route endpoints; (5) build reusable React views and map components; (6) connect the client through Axios; and (7) perform functional and integration checks. Location labels, coordinates, images, and opening hours are sample data and should be reviewed by the institution before publication.")


# PAGE 9 — Methodology graph and testing
page_break()
page_heading("5. Methodology (continued)", "Dijkstra routing, turn guidance, and verification")
doc.add_heading("5.4 Route computation", level=2)
para("The pedestrian network is modeled as a weighted graph G = (V, E). Each junction or path waypoint is a vertex v ∈ V. Each walkable connection is an edge e ∈ E. The current prototype treats connections as undirected; the edge cost is the Haversine distance between endpoint coordinates in metres. The route request supplies source and destination coordinates. The system attaches each to its nearest graph node, calculates the shortest graph path, and combines that path with the source and destination access legs.")
diagram_box("Route request: source coordinates + destination coordinates/name", fill="DCEAF5", font_size=8.5)
arrow()
diagram_box("Find nearest graph node for source and destination; check access distance limit")
arrow()
diagram_box("Initialise tentative distances: source = 0; all other nodes = ∞")
arrow()
diagram_box("Repeatedly extract the unvisited node with the smallest distance")
arrow()
diagram_box("Relax each connected edge: if current distance + edge weight is smaller, update distance and predecessor")
arrow()
diagram_box("Stop when destination is reached; follow predecessor links back to source")
arrow()
diagram_box("Add access legs; compute distance, estimated minutes, bearings, and turn phrases", fill="DCEAF5")
doc.add_heading("5.5 Direction generation", level=2)
para("After the path is recovered, consecutive coordinates provide segment bearings and segment lengths. The implementation compares each pair of bearings: a small change is described as continuing straight, a left or right change becomes a turn instruction, and a large reversal is treated as a U-turn. Segment lengths are rounded to metres for display. A final arrival message names the destination. These are geometric instructions generated from the modeled path, not a surveyed description of landmarks or a live navigation voice prompt.")
doc.add_heading("5.6 Testing and evaluation plan", level=2)
para("Functional testing should cover known locations, no-match search, category filtering, invalid route input, route requests for connected nodes, disconnected or out-of-network selections, and contact form validation. Integration testing should verify that the browser sends the expected JSON shapes and presents API errors clearly. Route verification should compare returned path edges with the maintained campus graph and manually walk representative routes after the graph is surveyed. Performance can be measured for API response time and page load on the target network; this synopsis reports no measurements because no benchmark dataset or test results were supplied.")
note_box("Key method dependency", "Shortest-path correctness can be checked computationally against the graph. Whether that path is a safe and usable real-world walking route requires ground-truth campus data and field validation.")


# PAGE 10 — Proposed system
page_break()
page_heading("6. Proposed System", "Architecture, modules, and data")
doc.add_heading("6.1 System overview", level=2)
para("WayFinder is organised as a browser client, REST backend, relational store, and map-tile provider. The React application manages page state and user interactions. Axios sends HTTP requests to FastAPI. FastAPI validates request and response shapes, calls route/search logic, and uses SQLAlchemy sessions to read or write SQLite records. React Leaflet renders the map and route geometry using Leaflet; OpenStreetMap provides the underlying tiles with required attribution [7], [8].")
diagram_box("Visitor / browser  →  React + React Router + Axios", fill="DCEAF5", font_size=9)
arrow()
diagram_box("FastAPI REST endpoints  →  validation, search, Dijkstra route service")
arrow()
diagram_box("SQLAlchemy data access  →  SQLite: locations, categories, contact messages", fill="E2F0D9")
doc.add_heading("6.2 Main modules", level=2)
for lead, text in [
    ("Home and discovery.", "Search bar, popular locations, category cards, map preview, and shared navigation."),
    ("Map and location detail.", "Leaflet markers and popups; selected location name, category, description, image, hours, coordinates, and a navigation action."),
    ("Route service.", "Accepts source/destination coordinates and optional destination label; returns route coordinate pairs, distance in metres, estimated walking minutes, and direction strings."),
    ("Search and category service.", "Searches the location catalogue and lists category options so the client can filter results."),
    ("Contact service.", "Validates and stores a visitor’s name, email, message, and creation time in SQLite."),
    ("Feedback and error handling.", "Toast notifications communicate success, no results, route errors, and contact submission status."),
]:
    para(lead + " " + text, bold_lead=lead)
doc.add_heading("6.3 Data entities and APIs", level=2)
para("The database contains Category (identifier and unique name), Location (identifier, name, category, latitude, longitude, description, image path, and opening-hours text), and ContactMessage (identifier, name, email, message, and creation timestamp). The API surface includes GET /health; GET /locations and GET /locations/{id}; GET /categories; POST /search; POST /route; and POST /contact. Standard HTTP status codes and request validation communicate missing records, invalid data, and successful operations. The service is intentionally small enough to explain in a student presentation while keeping route calculation separate from interface rendering.")
note_box("Map-data note", "OpenStreetMap is the basemap, not the source of the prototype’s campus routing graph. The walking edges and sample place coordinates need to be verified independently and updated with permission and attribution where applicable.")


# PAGE 11 — Future scope and conclusion
page_break()
page_heading("7. Future Scope", "Responsible next steps")
doc.add_heading("7.1 Possible improvements", level=2)
for lead, text in [
    ("Ground-truth campus mapping.", "Survey paths and entrances, verify coordinates, add missing pedestrian links, and appoint a data owner to maintain changes."),
    ("Accessible routing.", "Add attributes such as steps, ramps, surface, slope, width, and accessible entrances; allow users to select route preferences and validate routes with people with disabilities."),
    ("Live position and rerouting.", "With user consent, evaluate browser geolocation, position accuracy, battery use, privacy controls, and route recalculation when a visitor leaves the planned path."),
    ("Indoor navigation.", "Model building floors and room-level routes; assess QR codes, Wi-Fi, Bluetooth beacons, or visual positioning against cost, privacy, and maintenance requirements."),
    ("Richer routing costs.", "Support one-way paths, closures, construction, safety constraints, lighting, stairs, and time-dependent conditions; minimise a user-selected cost rather than distance alone."),
    ("Evaluation and deployment.", "Conduct usability tests with students and visitors, measure search and API response times under stated conditions, add automated tests, back up data, and monitor a hosted production service."),
    ("Multilingual and assistive output.", "Offer local-language labels, screen-reader-structured instructions, larger text, high contrast, and optional audio prompts after accessibility evaluation."),
]:
    para(lead + " " + text, bold_lead=lead)
doc.add_heading("8. Conclusion", level=1)
para("WayFinder addresses a practical campus problem: visitors may know where they need to go by name but lack a convenient way to locate it and understand a walking route. The proposed system integrates a searchable campus directory, map-based place browsing, a FastAPI service, SQLite records, and graph-based route calculation in a responsive web application. Dijkstra’s algorithm is used to minimise distance across the modeled pedestrian network, while segment bearings support simple written turn instructions and a distance-based time estimate.")
para("The project is suitable as an initial engineering prototype because its key elements are visible and explainable: the data model, API request, campus graph, shortest-path algorithm, and map display. Its results depend on the quality of the campus data, and its walking-time and turn text are estimates rather than field-validated guidance. The next responsible step is to validate the graph with the institution, evaluate routes with intended users, and add accessibility and privacy requirements before real-world deployment. Within those limits, WayFinder provides a clear foundation for a useful campus navigation service and a strong platform for further academic development.")


# PAGE 12 — References
page_break()
page_heading("9. References", "Research papers, standards, and official documentation")
refs = [
    "[1] E. W. Dijkstra, “A note on two problems in connexion with graphs,” Numerische Mathematik, vol. 1, pp. 269–271, 1959. doi: 10.1007/BF01386390. https://doi.org/10.1007/BF01386390",
    "[2] “An event-driven university campus navigation system on android platform,” IEEE Xplore, document 7083850. https://ieeexplore.ieee.org/document/7083850/",
    "[3] “Augmented reality based indoor positioning navigation tool,” in 2011 IEEE Conference on Open Systems (ICOS), 2011. doi: 10.1109/ICOS.2011.6079276. https://doi.org/10.1109/ICOS.2011.6079276",
    "[4] “GuideBeacon: Beacon-based indoor wayfinding for the blind, visually impaired, and disoriented,” in 2017 IEEE International Conference on Pervasive Computing and Communications (PerCom), 2017. doi: 10.1109/PERCOM.2017.7917858. https://doi.org/10.1109/PERCOM.2017.7917858",
    "[5] “Navigation system for blind, hearing and visually impaired people in ITU Ayazaga campus,” in 2017 International Conference on Computer Science and Engineering (UBMK/ICCNI), 2017. doi: 10.1109/ICCNI.2017.8123814. https://doi.org/10.1109/ICCNI.2017.8123814",
    "[6] “3D Mapping and Indoor Navigation for an Indoor Environment of the University Campus,” in 2023 IEEE International Symposium on Wireless Technology & Applications (ISWTA), 2023. doi: 10.1109/ISWTA58588.2023.10249749. https://doi.org/10.1109/ISWTA58588.2023.10249749",
    "[7] “Navigating MazeMap: indoor human mobility, spatio-logical ties and future potential,” arXiv:1401.5297, 2014. https://arxiv.org/abs/1401.5297",
    "[8] OpenStreetMap Foundation, “Copyright and License.” https://www.openstreetmap.org/copyright (accessed 16 Oct. 2026).",
    "[9] Leaflet, “Leaflet Documentation.” https://leafletjs.com/reference.html (accessed 16 Oct. 2026).",
    "[10] FastAPI, “FastAPI Documentation.” https://fastapi.tiangolo.com/ (accessed 16 Oct. 2026).",
    "[11] SQLAlchemy, “SQLAlchemy ORM Documentation.” https://docs.sqlalchemy.org/ (accessed 16 Oct. 2026).",
    "[12] React, “React Documentation.” https://react.dev/ (accessed 16 Oct. 2026).",
    "[13] SQLite, “SQLite Documentation.” https://www.sqlite.org/docs.html (accessed 16 Oct. 2026).",
]
for ref in refs:
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Inches(0.22)
    p.paragraph_format.first_line_indent = Inches(-0.22)
    p.paragraph_format.space_after = Pt(5)
    p.paragraph_format.line_spacing = 1.0
    r = p.add_run(ref)
    r.font.size = Pt(8.5)
    r.font.color.rgb = RGBColor.from_string(INK)
doc.add_paragraph()
note_box("Citation note", "Numbered references are cited in the Literature Survey and system description. IEEE Xplore entries are listed by their discoverable publication title and DOI/document record; verify full author, venue, and pagination details through the publisher record before final institutional submission.")


doc.core_properties.title = "WayFinder – Campus Navigation Guide: Project Synopsis"
doc.core_properties.subject = "B.Tech engineering project synopsis"
doc.core_properties.author = "WayFinder Project Team"
doc.core_properties.keywords = "campus navigation, Dijkstra, React, FastAPI, SQLite, OpenStreetMap"
doc.save(OUT)
print(OUT)
