// Configuration for MathJax
// This sets up MathJax to handle LaTeX-style math notation, including special packages and accessibility features
window.MathJax = {
    loader: { load: ['[tex]/cancel', '[tex]/color'] },
    tex: {
        inlineMath: [["$", "$"], ["\\(", "\\)"]],
        displayMath: [["$$", "$$"], ["\\[", "\\]"]],
        packages: { '[+]': ['cancel', 'color', 'enclose'] },
    },
    svg: { fontCache: "global" },
    options: {
        processHtmlClass: "mathjax",
        ignoreHtmlClass: "no-mathjax",
        renderActions: {
            assistiveMml: [
                10,
                (doc) => {
                    for (const math of doc.math) {
                        if (math.root) {
                            math.root.setProperty('a11y-tex-roles', true);
                            math.root.setProperty('a11y-tex-tree', true);
                        }
                    }
                },
                (doc) => {
                    const div = doc.adaptor.body(doc.document);
                    for (const math of doc.math) {
                        const mml = math.typesetRoot.querySelector('[aria-hidden]');
                        if (mml) {
                            const text = mml.getAttribute('aria-label');
                            if (text) {
                                const span = document.createElement('span');
                                span.setAttribute('aria-hidden', 'true');
                                span.textContent = text;
                                div.appendChild(span);
                            }
                        }
                    }
                },
            ]
        },
    },
    startup: {
        typeset: true,
        ready() {
            console.log('MathJax is ready');
            const { combineDefaults } = MathJax._.components.global;
            const { FindMathML } = MathJax._.input.mathml.FindMathML;

            class myFindMathML extends FindMathML {
                processMath(set) {
                    const adaptor = this.adaptor;
                    for (const node of set.values()) {
                        if (adaptor.hasClass(node, 'no-mathjax')) {
                            set.delete(node);
                        }
                    }
                    return super.processMath(set);
                }
            }

            combineDefaults(MathJax.config, 'mml', { FindMathML: new myFindMathML() });

            MathJax.startup.defaultReady();

            MathJax.typesetPromise().then(() => {
                console.log('MathJax typesetting complete');
                enhanceKaTeXCPLAccessibility();
                enhanceKaTeXAccessibility();
            }).catch((err) => console.log('MathJax typesetting failed: ', err));
        }
    }
};

// Enhances accessibility for KaTeX elements within CPL (Curriculum Pathways) articles
// It processes various types of math content (header, body, select, dropdown, radio, section, fraction)
// and creates a summary container with all the processed content
function enhanceKaTeXCPLAccessibility() {
    document.querySelectorAll('article.cpl:has(.katex)').forEach(function (cplArticle) {
        const outputContainer = document.createElement('div');
        outputContainer.classList.add('katex-output-container');

        let headerMath = '';
        let bodyMath = '';
        let selectContent = '';
        let dropdownContent = '';
        let radioContent = '';
        let sectionContent = '';
        let fractionInputContent = '';

        cplArticle.querySelectorAll('.katex').forEach(function (elem) {
            let mathmlElem = elem.querySelector('.katex-mathml mjx-container');
            let ariaLabel = mathmlElem ? mathmlElem.getAttribute('aria-label') : '';

            if (elem.closest('.cpl-header')) {
                headerMath += ariaLabel + '\n';
            } else if (elem.closest('select') || elem.closest('ul') || elem.closest('.fraction')) {
            } else {
                bodyMath += ariaLabel + '\n';
            }
        });

        cplArticle.querySelectorAll('select:has(.katex)').forEach(function (select) {
            selectContent += 'Select content: ';
            Array.from(select.options).forEach(option => {
                let katexElem = option.querySelector('.katex-mathml mjx-container');
                selectContent += katexElem ? katexElem.getAttribute('aria-label') + ' ' : option.textContent + ' ';
            });
            selectContent += '\n';
        });

        cplArticle.querySelectorAll('ul.dropdown-menu:has(.katex)').forEach(function (ul) {
            dropdownContent += 'Dropdown content: ';
            ul.querySelectorAll('li').forEach(li => {
                let katexElem = li.querySelector('.katex-mathml mjx-container');
                dropdownContent += katexElem ? katexElem.getAttribute('aria-label') + ' ' : li.textContent + ' ';
            });
            dropdownContent += '\n';
        });

        let radioGroups = new Set(Array.from(cplArticle.querySelectorAll('input[type="radio"]')).map(radio => radio.name));
        radioGroups.forEach(groupName => {
            radioContent += `Radio values ${groupName}: `;
            cplArticle.querySelectorAll(`input[type="radio"][name="${groupName}"]`).forEach(radio => {
                let label = cplArticle.querySelector(`label[for="${radio.id}"]`);
                if (label && label.querySelector('.katex')) {
                    let katexElem = label.querySelector('.katex-mathml mjx-container');
                    if (katexElem) {
                        radioContent += katexElem.getAttribute('aria-label') + ' ';
                    } else {
                        radioContent += label.textContent.trim() + ' ';
                    }
                }
            });
            if (radioContent.endsWith(': ')) {
                radioContent = radioContent.slice(0, -2);
            } else {
                radioContent += '\n';
            }
        });

        cplArticle.querySelectorAll('section:has(.katex)').forEach(function (section, index) {
            let sectionMath = '';
            section.querySelectorAll('.katex').forEach(function (elem) {
                let mathmlElem = elem.querySelector('.katex-mathml mjx-container');
                sectionMath += mathmlElem ? mathmlElem.getAttribute('aria-label') + ' ' : '';
            });
            sectionContent += `Section ${String.fromCharCode(97 + index)} = ${sectionMath.trim()}\n`;
        });

        cplArticle.querySelectorAll('.fraction:has(.katex)').forEach(function (fraction, index) {
            fractionInputContent += `Fraction ${index + 1}: `;
            fraction.querySelectorAll('input[type="text"]').forEach(input => {
                fractionInputContent += `${input.value || 'empty'} `;
            });
            let katexElem = fraction.querySelector('.katex-mathml mjx-container');
            if (katexElem) {
                fractionInputContent += katexElem.getAttribute('aria-label') + ' ';
            }
            fractionInputContent += '\n';
        });

        if (headerMath) outputContainer.appendChild(createParagraph('Header math content', headerMath));
        if (bodyMath) outputContainer.appendChild(createParagraph('Body math content', bodyMath));
        if (selectContent) outputContainer.appendChild(createParagraph('Select content', selectContent));
        if (dropdownContent) outputContainer.appendChild(createParagraph('Dropdown content', dropdownContent));
        if (radioContent) outputContainer.appendChild(createParagraph('Radio content', radioContent));
        if (sectionContent) outputContainer.appendChild(createParagraph('Section content', sectionContent));
        if (fractionInputContent) outputContainer.appendChild(createParagraph('Fraction input content', fractionInputContent));

        cplArticle.appendChild(outputContainer);
    });
}

// Creates a paragraph element with a label and content
// Used to create summary paragraphs for different types of math content
function createParagraph(label, content) {
    const paragraph = document.createElement('p');
    paragraph.textContent = `${label} = ${content.trim()}`;
    paragraph.classList.add('math-output-screen');
    return paragraph;
}

// Enhances accessibility for KaTeX elements outside of CPL articles
// It adds aria-label paragraphs for each KaTeX element
function enhanceKaTeXAccessibility() {
    document.querySelectorAll('.katex').forEach(function (elem) {
        if (elem.closest('article.cpl')) {
            return;
        }

        let mathmlElem = elem.querySelector('.katex-mathml mjx-container');
        if (mathmlElem) {
            let ariaLabel = mathmlElem.getAttribute('aria-label');
            if (ariaLabel) {
                addAriaLabelParagraph(elem, ariaLabel);
            }
        }
    });
}

// Adds an aria-label paragraph after a KaTeX element or its parent paragraph
function addAriaLabelParagraph(elem, description) {
    const newParagraph = document.createElement('p');
    newParagraph.textContent = `math = ${description}`;
    newParagraph.classList.add('math-output-screen');
    const parentP = elem.closest('p');

    if (parentP) {
        parentP.insertAdjacentElement('afterend', newParagraph);
    } else {
        elem.insertAdjacentElement('afterend', newParagraph);
    }
}

// Sets up dropdown togglers for elements with the 'toggler' class
// Handles click events to show/hide dropdown menus
function setupDropdownTogglers() {
    document.querySelectorAll('.toggler').forEach(toggler => {
        const toggleButton = toggler.querySelector('.dropdown');
        const dropdownMenu = toggler.querySelector('.dropdown-menu');

        toggleButton.addEventListener('click', (event) => {
            event.stopPropagation();
            toggleButton.classList.toggle('active');
            dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
        });

        dropdownMenu.addEventListener('click', (event) => {
            if (event.target.tagName === 'LI') {
                dropdownMenu.style.display = 'none';
            }

            if (event.target.tagName === 'P') {
                toggleButton.innerHTML = event.target.innerHTML;
                dropdownMenu.style.display = 'none';
            }

            toggleButton.classList.toggle('active');
        });

        document.addEventListener('click', (event) => {
            if (!dropdownMenu.contains(event.target) && !toggleButton.contains(event.target)) {
                dropdownMenu.style.display = 'none';
            }
        });
    });
}

// Sets up math rendering in select elements
// Renders math content in option elements using KaTeX, MathML, or MathJax
function setupMathInSelects() {
    const selects = document.querySelectorAll('select');

    selects.forEach(select => {
        const options = select.querySelectorAll('option[data-math]');

        options.forEach(option => {
            const math = option.getAttribute('data-math');
            let renderedMath;
            if (math.includes('\\(') || math.includes('\\[')) {
                renderedMath = katex.renderToString(math, {
                    throwOnError: false
                });
            } else if (math.includes('<math')) {
                renderedMath = math;
            } else {
                renderedMath = math;
            }
            option.setAttribute('data-rendered', renderedMath);
        });
    });
}

// Sets up a font selection functionality
// Changes the font class for KaTeX, MathML, and MathJax elements based on user selection
function setupFontSelect() {
    const fontSelect = document.querySelector('select');
    let currentClass = '';

    fontSelect.addEventListener('change', (event) => {
        const selectedClass = event.target.value;

        if (currentClass) {
            document.querySelectorAll('.katex, math, .MathJax').forEach(element => {
                element.classList.remove(currentClass);
            });
        }

        document.querySelectorAll('.katex, math, .MathJax').forEach(element => {
            element.classList.add(selectedClass);
        });

        currentClass = selectedClass;
    });
}

// Sets up a "Return to Top" button
// The button appears when scrolling down and scrolls the page to the top when clicked
function setupReturnToTopButton() {
    const returnToTopButton = document.createElement('button');
    returnToTopButton.id = 'return-to-top';
    returnToTopButton.innerHTML = `
        <svg width="24" height="24">
            <use xlink:href="#arrow-up"></use>
        </svg>
    `;
    returnToTopButton.classList.add('connect__button', 'primary', 'icon');
    document.body.appendChild(returnToTopButton);

    window.addEventListener('scroll', () => {
        if (window.scrollY > window.innerHeight) {
            returnToTopButton.style.display = 'flex';
        } else {
            returnToTopButton.style.display = 'none';
        }
    });

    returnToTopButton.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// Event listener for when the DOM content is loaded
// Initializes KaTeX rendering and sets up various UI functionalities
document.addEventListener("DOMContentLoaded", () => {
    renderMathInElement(document.body, {
        delimiters: [
            { left: "\\(", right: "\\)", display: false },
            { left: "\\[", right: "\\]", display: true },
        ],
        strict: "ignore",
        macros: {
            "\\enclose": "\\enclose",
        },
        ignoredTags: [
            "script",
            "noscript",
            "style",
            "textarea",
            "pre",
            "code",
        ],
        ignoredClasses: ["mathjax"],
    });

    setupDropdownTogglers();
    setupMathInSelects();
    setupFontSelect();
    setupReturnToTopButton();
});