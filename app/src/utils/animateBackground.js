const getRandomFloat = (min, max) => {
    return (Math.random() * (max - min) + min);
};

const generateCubicBezier = () => {
    return {
        x1: parseFloat(getRandomFloat(0, 1).toFixed(2)),
        y1: parseFloat(getRandomFloat(-2, 2).toFixed(2)),
        x2: parseFloat(getRandomFloat(0, 1).toFixed(2)),
        y2: parseFloat(getRandomFloat(-2, 2).toFixed(2))
    };
};

const applyBackgroundAnimation = () => {
    const totalLights = 15;
    const softness = 100;
    const animationDurationS = 20;
    const colors = ["#e86138", "#c52d67", "#a14101"];
    const container = document.querySelector(".bg-container");
    const fragment = document.createDocumentFragment();
    let sheetContent = "";

    const sheet = document.createElement("STYLE");
    sheet.setAttribute("id", "#bgAnimation");

    sheetContent += `.bg-light::after{content:"";display:block;}`;

    for (let i = 0; i < totalLights; i++) {
        const div = document.createElement("DIV");
        div.classList.add("bg-light");

        fragment.appendChild(div);

        const xAxis = generateCubicBezier();
        const startX = Math.floor(getRandomFloat(10, 90));
        const startY = Math.floor(getRandomFloat(10, 90));
        sheetContent += `.bg-container>:nth-child(${i + 1}){transform:translate(${startX}vw,${startY}vh);animation:xAxis${i + 1} ${animationDurationS}s infinite cubic-bezier(${xAxis.x1},${xAxis.y1},${xAxis.x2},${xAxis.y2});}`;
        
        const yAxis = generateCubicBezier();
        const color = colors[Math.floor(getRandomFloat(0, colors.length))];
        sheetContent += `.bg-container>:nth-child(${i + 1})::after{width:20px;box-shadow:0 0 ${softness}px 100px ${color};animation:yAxis${i + 1} ${animationDurationS}s infinite cubic-bezier(${yAxis.x1},${yAxis.y1},${yAxis.x2},${yAxis.y2});}`;

        const moveToX = Math.floor(getRandomFloat(10, 90));
        const moveToY = Math.floor(getRandomFloat(10, 90));
        sheetContent += `@keyframes xAxis${i + 1} {50%{transform:translateX(${moveToX}vw);100%{transform:translateX(${startX}vw)}}}`;
        sheetContent += `@keyframes yAxis${i + 1} {50%{transform:translateY(${moveToY}vh);100%{transform:translateX(${startY}vh)}}}`;
    }

    sheet.appendChild(document.createTextNode(sheetContent));
    
    document.head.appendChild(sheet);
    container.appendChild(fragment);

    container.ontransitionend = null;
    container.classList.remove("inactive");
};

const removeBackgroundAnimation = () => {
    const container = document.querySelector(".bg-container");

    container.ontransitionend = () => {
        container.innerHTML = "";
        [...document.head.childNodes].forEach(node => {
            if (node.id === "#bgAnimation") document.head.removeChild(node);
        });
    };
    
    container.classList.add("inactive");
};
