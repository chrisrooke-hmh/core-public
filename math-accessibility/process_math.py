from bs4 import BeautifulSoup

def generate_expected_output(math_element, device):
    # Extract the rendered content as is
    output = ''.join(str(e) for e in math_element.contents)

    # Remove any duplicate words
    output = ' '.join(dict.fromkeys(output.split()))

    # Return the output wrapped in the desired HTML structure
    return f'<p><span>{device}</span> expected output: {output}</p>'

def process_html(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()

    soup = BeautifulSoup(content, 'html.parser')

    for article in soup.find_all('article'):
        # Ignore articles within the 'cpl' class
        if article.find_parent(class_='cpl'):
            continue

        # Handle .katex elements separately
        katex_elements = article.find_all(class_='katex')
        if katex_elements:
            for katex_element in katex_elements:
                voiceover_output = generate_expected_output(katex_element, "VoiceOver")
                nvda_jaws_output = generate_expected_output(katex_element, "NVDA JAWS")

                # Append the generated HTML directly after the KaTeX element
                katex_element.insert_after(BeautifulSoup(voiceover_output, 'html.parser'))
                katex_element.insert_after(BeautifulSoup(nvda_jaws_output, 'html.parser'))
        else:
            # Handle other math elements
            other_math_elements = article.find_all(['math', 'MathJax'])
            if other_math_elements:
                for math_element in other_math_elements:
                    voiceover_output = generate_expected_output(math_element, "VoiceOver")
                    nvda_jaws_output = generate_expected_output(math_element, "NVDA JAWS")

                    # Append the generated HTML directly after the math element
                    math_element.insert_after(BeautifulSoup(voiceover_output, 'html.parser'))
                    math_element.insert_after(BeautifulSoup(nvda_jaws_output, 'html.parser'))

    # Save the modified HTML content
    with open('output.html', 'w', encoding='utf-8') as file:
        file.write(str(soup))

if __name__ == '__main__':
    process_html('index.html')