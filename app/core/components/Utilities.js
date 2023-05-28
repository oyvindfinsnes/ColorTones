class Utilities {
    static formatSecondsToTimestamp(seconds, formatTimeComponents = false) {
        const t = Math.floor(seconds);
        const h = Math.floor(t / 3600);
        const m = Math.floor(t / 60) % 60;
        const s = t % 60;
    
        if (formatTimeComponents) {
            return h
                ? `${h}hr ${m >= 10 ? m : "0" + m}min`
                : `${m}min ${s >= 10 ? s : "0" + s}sec`;
        }

        return h
            ? `${h}:${m >= 10 ? m : "0" + m}:${s >= 10 ? s : "0" + s}`
            : `${m}:${s >= 10 ? s : "0" + s}`;
    }
    
    static remap = (val, inMin, inMax, outMin, outMax) => {
        return (val - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    }

    static pathToHTMLSafeString(sourcePath) {
        return sourcePath.replace(/[\\\/|\:]/g, "");
    }

    static basename(path) {
        return path.split(/[\\/]/).pop();
    }

    static InterfaceEffects = class {
        static _getRandomFloat(min, max) {
            return (Math.random() * (max - min) + min);
        }
        
        static _generateCubicBezier() {
            return {
                x1: parseFloat(Utilities.InterfaceEffects._getRandomFloat(0, 1).toFixed(2)),
                y1: parseFloat(Utilities.InterfaceEffects._getRandomFloat(-2, 2).toFixed(2)),
                x2: parseFloat(Utilities.InterfaceEffects._getRandomFloat(0, 1).toFixed(2)),
                y2: parseFloat(Utilities.InterfaceEffects._getRandomFloat(-2, 2).toFixed(2))
            }
        }

        static applyBackgroundAnimation(accent1, accent2) {
            const totalLights = 20;
            const size = 180;
            const softness = 180;
            const animationDurationS = 35;
            const colors = [accent1, accent2];
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
        
                const xAxis = Utilities.InterfaceEffects._generateCubicBezier();
                const startX = Math.floor(Utilities.InterfaceEffects._getRandomFloat(10, 90));
                const startY = Math.floor(Utilities.InterfaceEffects._getRandomFloat(10, 90));
                sheetContent += `.bg-container>:nth-child(${i + 1}){
                    transform:translate(${startX}vw,${startY}vh);
                    animation:xAxis${i + 1} ${animationDurationS}s infinite cubic-bezier(${xAxis.x1},${xAxis.y1},${xAxis.x2},${xAxis.y2});
                }`;
                
                const yAxis = Utilities.InterfaceEffects._generateCubicBezier();
                const color = colors[Math.floor(Utilities.InterfaceEffects._getRandomFloat(0, colors.length))];
                sheetContent += `.bg-container>:nth-child(${i + 1})::after{
                    width:30px;
                    box-shadow:0 0 ${softness}px ${size}px ${color};
                    animation:yAxis${i + 1} ${animationDurationS}s infinite cubic-bezier(${yAxis.x1},${yAxis.y1},${yAxis.x2},${yAxis.y2});
                }`;
        
                const moveToX = Math.floor(Utilities.InterfaceEffects._getRandomFloat(10, 90));
                const moveToY = Math.floor(Utilities.InterfaceEffects._getRandomFloat(10, 90));
                sheetContent += `@keyframes xAxis${i + 1}{
                    50%{transform:translateX(${moveToX}vw);
                    100%{transform:translateX(${startX}vw)}
                }}`;
                sheetContent += `@keyframes yAxis${i + 1}{
                    50%{transform:translateY(${moveToY}vh);
                    100%{transform:translateX(${startY}vh)}
                }}`;
            }
        
            sheet.appendChild(document.createTextNode(sheetContent));
            
            document.head.appendChild(sheet);
            container.appendChild(fragment);
        
            container.ontransitionend = null;
            container.classList.remove("inactive");
        }
        
        static removeBackgroundAnimation() {
            const container = document.querySelector(".bg-container");
        
            container.ontransitionend = () => {
                container.innerHTML = "";
                [...document.head.childNodes].forEach(node => {
                    if (node.id === "#bgAnimation") document.head.removeChild(node);
                });
            };
            
            container.classList.add("inactive");
        }

        static applySoundbarsAnimationStyles() {
            let sheetContent = "";
    
            const sheet = document.createElement("STYLE");
            sheet.setAttribute("id", "#soundbarsAnimation");

            const barHeight = 18;
            const barWidth = 3;
            const totalBars = 4;
            const gapWidth = 2;
            const totalGaps = 3;
            const totalWidth = (barWidth * totalBars) + (gapWidth * totalGaps);
            sheetContent = `
                @keyframes barVariation1{
                    0%{transform:scaleY(20%)}
                    90%{transform:scaleY(100%)}
                    100%{transform:scaleY(20%)}
                }
                @keyframes barVariation2{
                    0%{transform:scaleY(30%)}
                    90%{transform:scaleY(80%)}
                    100%{transform:scaleY(30%)}
                }
                @keyframes barVariation3{
                    0%{transform:scaleY(10%)}
                    90%{transform:scaleY(60%)}
                    100%{transform:scaleY(10%)}
                }
                .soundbars,.soundbars .bar,.soundbars .gap{display:inline-block;}
                .soundbars{width:${totalWidth}px;height:${barHeight}px;}
                .soundbars .gap{width:${gapWidth}px;}
                .soundbars .bar{width:${barWidth}px;height:100%;transform-origin:50% 100%;}
                .soundbars .bar:nth-child(1){
                    animation:barVariation2 0.8s linear infinite;
                    animation-delay: 0.5s;
                }
                .soundbars .bar:nth-child(3){
                    animation:barVariation3 0.7s linear infinite;
                }
                .soundbars .bar:nth-child(5){
                    animation:barVariation1 0.8s linear infinite;
                }
                .soundbars .bar:nth-child(7){
                    animation:barVariation2 1s linear infinite;
                }
            `;

            sheet.appendChild(document.createTextNode(sheetContent));
            document.head.appendChild(sheet);
        }

        static applySoundbarsAnimationElement(parent, prepend = false) {
            const soundbars = document.createElement("DIV");
            soundbars.classList.add("soundbars");
            soundbars.innerHTML = `<div class="bar"></div><div class="gap"></div><div class="bar"></div><div class="gap"></div><div class="bar"></div><div class="gap"></div><div class="bar"></div>`;

            prepend ? parent.prepend(soundbars) : parent.appendChild(soundbars);
        }
    }

    /* 
        Class derived from //https://github.com/angel-rs/css-color-filter-generator
        A few integration changes have been made to the original code
    */
    static CSSFilterGenerator = class {
        static compute = inputColor => {
            const hexToRgb = hex => {
                const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : null;
            }
        
            let bestResult = null;
            let bestLoss = Infinity;
            const rgb = hexToRgb(inputColor);
            const color = new Utilities.CSSFilterGenerator.Color(rgb[0], rgb[1], rgb[2]);
        
            for (let i = 0; i < 50; i++) {
                const result = new Utilities.CSSFilterGenerator.Solver(color).solve();
        
                if (result.loss < bestLoss) {
                    bestResult = result;
                    bestLoss = result.loss;
                }
            }
        
            return bestResult.filterRaw;
        }
    }
}

// CSSFilterGenerator child classes ============================================
Utilities.CSSFilterGenerator.Color = class Color {
    constructor(r, g, b) {
        this.set(r, g, b);
    }

    set(r, g, b) {
        this.r = this.clamp(r);
        this.g = this.clamp(g);
        this.b = this.clamp(b);
    }

    hueRotate(angle = 0) {
        angle = angle / 180 * Math.PI;
        const sin = Math.sin(angle);
        const cos = Math.cos(angle);

        this.multiply([
            0.213 + cos * 0.787 - sin * 0.213,
            0.715 - cos * 0.715 - sin * 0.715,
            0.072 - cos * 0.072 + sin * 0.928,
            0.213 - cos * 0.213 + sin * 0.143,
            0.715 + cos * 0.285 + sin * 0.140,
            0.072 - cos * 0.072 - sin * 0.283,
            0.213 - cos * 0.213 - sin * 0.787,
            0.715 - cos * 0.715 + sin * 0.715,
            0.072 + cos * 0.928 + sin * 0.072
        ]);
    }

    grayscale(value = 1) {
        this.multiply([
            0.2126 + 0.7874 * (1 - value),
            0.7152 - 0.7152 * (1 - value),
            0.0722 - 0.0722 * (1 - value),
            0.2126 - 0.2126 * (1 - value),
            0.7152 + 0.2848 * (1 - value),
            0.0722 - 0.0722 * (1 - value),
            0.2126 - 0.2126 * (1 - value),
            0.7152 - 0.7152 * (1 - value),
            0.0722 + 0.9278 * (1 - value)
        ]);
    }

    sepia(value = 1) {
        this.multiply([
            0.393 + 0.607 * (1 - value),
            0.769 - 0.769 * (1 - value),
            0.189 - 0.189 * (1 - value),
            0.349 - 0.349 * (1 - value),
            0.686 + 0.314 * (1 - value),
            0.168 - 0.168 * (1 - value),
            0.272 - 0.272 * (1 - value),
            0.534 - 0.534 * (1 - value),
            0.131 + 0.869 * (1 - value)
        ]);
    }

    saturate(value = 1) {
        this.multiply([
            0.213 + 0.787 * value,
            0.715 - 0.715 * value,
            0.072 - 0.072 * value,
            0.213 - 0.213 * value,
            0.715 + 0.285 * value,
            0.072 - 0.072 * value,
            0.213 - 0.213 * value,
            0.715 - 0.715 * value,
            0.072 + 0.928 * value
        ]);
    }

    multiply(matrix) {
        const newR = this.clamp(this.r * matrix[0] + this.g * matrix[1] + this.b * matrix[2]);
        const newG = this.clamp(this.r * matrix[3] + this.g * matrix[4] + this.b * matrix[5]);
        const newB = this.clamp(this.r * matrix[6] + this.g * matrix[7] + this.b * matrix[8]);
        this.r = newR;
        this.g = newG;
        this.b = newB;
    }

    brightness(value = 1) {
        this.linear(value);
    }
    contrast(value = 1) {
        this.linear(value, -(0.5 * value) + 0.5);
    }

    linear(slope = 1, intercept = 0) {
        this.r = this.clamp(this.r * slope + intercept * 255);
        this.g = this.clamp(this.g * slope + intercept * 255);
        this.b = this.clamp(this.b * slope + intercept * 255);
    }

    invert(value = 1) {
        this.r = this.clamp((value + this.r / 255 * (1 - 2 * value)) * 255);
        this.g = this.clamp((value + this.g / 255 * (1 - 2 * value)) * 255);
        this.b = this.clamp((value + this.b / 255 * (1 - 2 * value)) * 255);
    }

    hsl() {
        const r = this.r / 255;
        const g = this.g / 255;
        const b = this.b / 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                case b:
                    h = (r - g) / d + 4;
                    break;
            }
            
            h /= 6;
        }

        return { h: h * 100, s: s * 100, l: l * 100 };
    }

    clamp(value) {
        return value > 255 ? 255 : (value < 0 ? 0 : value);
    }
}

Utilities.CSSFilterGenerator.Solver = class Solver {
    constructor(target) {
        this.target = target;
        this.targetHSL = target.hsl();
        this.reusedColor = new Utilities.CSSFilterGenerator.Color(0, 0, 0);
    }

    solve() {
        const result = this.solveNarrow(this.solveWide());
        
        return {
            values: result.values,
            loss: result.loss,
            filter: this.css(result.values),
            filterRaw: this.raw(result.values),
        };
    }

    solveWide() {
        const A = 5;
        const c = 15;
        const a = [60, 180, 18000, 600, 1.2, 1.2];

        let best = { loss: Infinity };

        for (let i = 0; best.loss > 25 && i < 3; i++) {
            const initial = [50, 20, 3750, 50, 100, 100];
            const result = this.spsa(A, a, c, initial, 1000);
            
            if (result.loss < best.loss) {
                best = result;
            }
        }
        
        return best;
    }

    solveNarrow(wide) {
        const A = wide.loss;
        const c = 2;
        const A1 = A + 1;
        const a = [0.25 * A1, 0.25 * A1, A1, 0.25 * A1, 0.2 * A1, 0.2 * A1];
        
        return this.spsa(A, a, c, wide.values, 500);
    }

    spsa(A, a, c, values, iters) {
        const alpha = 1;
        const gamma = 0.16666666666666666;

        let best = null;
        let bestLoss = Infinity;
        const deltas = new Array(6);
        const highArgs = new Array(6);
        const lowArgs = new Array(6);

        const fix = (value, idx) => {
            let max = 100;

            if (idx === 2) {
                max = 7500;
            } else if (idx === 4 || idx === 5) {
                max = 200;
            }
    
            if (idx === 3) {
                if (value > max) {
                value %= max;
                } else if (value < 0) {
                value = max + value % max;
                }
            } else if (value < 0) {
                value = 0;
            } else if (value > max) {
                value = max;
            }
            
            return value;
        }

        for (let k = 0; k < iters; k++) {
            const ck = c / Math.pow(k + 1, gamma);
            
            for (let i = 0; i < 6; i++) {
                deltas[i] = Math.random() > 0.5 ? 1 : -1;
                highArgs[i] = values[i] + ck * deltas[i];
                lowArgs[i] = values[i] - ck * deltas[i];
            }

            const lossDiff = this.loss(highArgs) - this.loss(lowArgs);
            
            for (let i = 0; i < 6; i++) {
                const g = lossDiff / (2 * ck) * deltas[i];
                const ak = a[i] / Math.pow(A + k + 1, alpha);
                values[i] = fix(values[i] - ak * g, i);
            }

            const loss = this.loss(values);
            
            if (loss < bestLoss) {
                best = values.slice(0);
                bestLoss = loss;
            }
        }
        
        return { values: best, loss: bestLoss };
    }

    loss(filters) {
        const color = this.reusedColor;
        color.set(0, 0, 0);

        color.invert(filters[0] / 100);
        color.sepia(filters[1] / 100);
        color.saturate(filters[2] / 100);
        color.hueRotate(filters[3] * 3.6);
        color.brightness(filters[4] / 100);
        color.contrast(filters[5] / 100);

        const colorHSL = color.hsl();
        
        return (
            Math.abs(color.r - this.target.r) +
            Math.abs(color.g - this.target.g) +
            Math.abs(color.b - this.target.b) +
            Math.abs(colorHSL.h - this.targetHSL.h) +
            Math.abs(colorHSL.s - this.targetHSL.s) +
            Math.abs(colorHSL.l - this.targetHSL.l)
        );
    }

    raw(filters) {
        const fmt = (idx, multiplier = 1) => {
            return Math.round(filters[idx] * multiplier);
        }
        
        return `brightness(0) saturate(100%) invert(${fmt(0)}%) sepia(${fmt(1)}%) saturate(${fmt(2)}%) hue-rotate(${fmt(3, 3.6)}deg) brightness(${fmt(4)}%) contrast(${fmt(5)}%)`;
    }

    css(filters) {
        const fmt = (idx, multiplier = 1) => {
            return Math.round(filters[idx] * multiplier);
        }

        return `filter: brightness(0) saturate(100%) invert(${fmt(0)}%) sepia(${fmt(1)}%) saturate(${fmt(2)}%) hue-rotate(${fmt(3, 3.6)}deg) brightness(${fmt(4)}%) contrast(${fmt(5)}%);`;
    }
}
