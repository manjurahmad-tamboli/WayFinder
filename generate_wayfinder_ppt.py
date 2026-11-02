import sys
from pathlib import Path
from pptx import Presentation
from pptx.util import Inches, Pt

# Define slide titles and bullet points (placeholders)
slides_content = [
    ("Project Title", ["WayFinder: A Navigation Assistance System"]),
    ("Introduction", ["Brief overview of the project", "Motivation and relevance", "Target audience"]),
    ("Literature Survey / Existing System", ["Current solutions in navigation", "Limitations of existing systems"]),
    ("Objectives", ["Define clear objectives for WayFinder", "Improve navigation accuracy", "Enhance user experience"]),
    ("Problem Statement", ["Identify gaps in current navigation tools", "Challenges to be addressed"]),
    ("Proposed System", ["High‑level architecture", "Key components and their roles", "Innovative features"]),
    ("Methodology", ["Requirement gathering", "System design", "Implementation steps", "Testing strategy"]),
    ("Expected Outcomes", ["Functional prototype", "Performance metrics", "User satisfaction goals"]),
    ("Future Scope", ["Scalability options", "Integration with other services", "Potential enhancements"]),
    ("References", ["Cite relevant research papers", "Web resources", "Standards and guidelines"]),
]

# Create a presentation
prs = Presentation()
# Set slide size (default) and white background (default is white)

for title, bullet_points in slides_content:
    slide_layout = prs.slide_layouts[1]  # Title and Content layout
    slide = prs.slides.add_slide(slide_layout)
    # Set title
    slide.shapes.title.text = title
    # Add bullet points
    body = slide.placeholders[1]
    tf = body.text_frame
    tf.clear()
    for i, pt in enumerate(bullet_points):
        p = tf.add_paragraph() if i else tf.paragraphs[0]
        p.text = pt
        p.level = 0
        p.font.size = Pt(18)
        p.font.name = 'Calibri'
        p.font.bold = False
        p.font.italic = False
        # Using default font color (no explicit setting)
    # Placeholder for diagram/flowchart note
    # Users can replace a bullet point with an appropriate diagram later.

# Save the presentation in the workspace
output_path = Path('c:/Users/IDEAPAD GAMING/OneDrive/Documents/WayFinder/WayFinder_Presentation.pptx')
prs.save(output_path)
print(f"Presentation generated at {output_path}")
