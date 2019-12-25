import os
os.chdir(os.path.dirname(os.path.abspath(__file__)))

content_fname = "web01-input.txt"
html_template_fname = "web01-template.html"
html_fname = "web01.html"
TEMPLATE = "{{ CONTENT }}"

with open(content_fname, "r") as f:
    content = f.read()

with open(html_template_fname, "r") as f:
    html = f.read()

new_html = html.replace(TEMPLATE, content)

with open(html_fname, "w") as f:
    f.write(new_html)

print(f"UPDATED: {html_fname}")
