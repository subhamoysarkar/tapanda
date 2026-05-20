import re

with open('/Users/isense/Documents/Github/tapanda/styles.css', 'r') as f:
    content = f.read()

# Removing the specific blocks for .about and related classes
blocks_to_remove = [
    r'/\* --- ABOUT --- \*/\s*\n',
    r'\.about\s*\{[^}]*\}\s*',
    r'\.about \.container,\s*\n\.contact \.container\s*\{[^}]*\}\s*',
    r'\.about-grid\s*\{[^}]*\}\s*',
    r'@media \([^)]+\)\s*\{\s*\.about-grid\s*\{[^}]*\}\s*\}\s*',
    r'\.about-image-wrapper\s*\{[^}]*\}\s*',
    r'\.about-founders-img\s*\{[^}]*\}\s*',
    r'\.about-founders-label\s*\{[^}]*\}\s*',
    r'\.founder-names\s*\{[^}]*\}\s*',
    r'\.founder-designation\s*\{[^}]*\}\s*',
    r'\.about-content\s*\{[^}]*\}\s*',
    r'\.about-paragraphs\s*\{[^}]*\}\s*',
    r'\.about-content p\s*\{[^}]*\}\s*',
    r'\.about-content p:last-child\s*\{[^}]*\}\s*',
    r'\.about-quote\s*\{[^}]*\}\s*',
    r'\.about-header\s*\{[^}]*\}\s*',
    r'\.about-header \.headline-serif\s*\{[^}]*\}\s*',
]

for pattern in blocks_to_remove:
    content = re.sub(pattern, '', content)

# Also removing .about .container block was shared with .contact .container
# Let's restore .contact .container
content = content + "\n.contact .container {\n  width: 95%;\n  max-width: 1600px;\n  margin: 0 auto;\n  padding: 80px 0 20px 0;\n  box-sizing: border-box;\n}\n"

# Remove all occurrences of .about-grid, .about-image, .about-text, .about-header inside @media
# It's safer to just replace them line by line if they are just single classes, but a regex is better.
content = re.sub(r'\s*\.about-grid\s*\{[^}]*\}', '', content)
content = re.sub(r'\s*\.about-image\s*\{[^}]*\}', '', content)
content = re.sub(r'\s*\.about-header \.headline-serif,\s*\n\s*\.about-text \.headline-serif\s*\{[^}]*\}', '', content)
content = re.sub(r'\s*\.about-text p\s*\{[^}]*\}', '', content)

with open('/Users/isense/Documents/Github/tapanda/styles.css', 'w') as f:
    f.write(content)

