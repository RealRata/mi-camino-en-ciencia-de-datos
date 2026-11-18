(() => {
  "use strict";

  const STORAGE_KEY = "data-quest-practicas-v2";
  const checks = Array.from(document.querySelectorAll("[data-lesson]"));
  const progressFill = document.getElementById("progressFill");
  const progressPercent = document.getElementById("progressPercent");
  const progressText = document.getElementById("progressText");
  const searchInput = document.getElementById("lessonSearch");
  const lessonCount = document.getElementById("lessonCount");
  const emptyState = document.getElementById("emptyState");
  const lessonCards = Array.from(document.querySelectorAll(".lesson"));

  function loadProgress() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      checks.forEach((check) => {
        check.checked = saved[check.dataset.lesson] === true;
      });
    } catch (error) {
      console.warn("No fue posible recuperar el progreso guardado.", error);
    }
  }

  function updateProgress() {
    const total = checks.length;
    const done = checks.filter((check) => check.checked).length;
    const percent = total ? Math.round((done / total) * 100) : 0;

    if (progressFill) progressFill.style.width = percent + "%";
    if (progressPercent) progressPercent.textContent = percent + "%";
    if (progressText) progressText.textContent = done + " de " + total + " prácticas completadas";

    checks.forEach((check) => {
      const card = check.closest(".lesson");
      if (card) card.classList.toggle("completed", check.checked);
    });
  }

  function saveProgress() {
    const state = {};
    checks.forEach((check) => {
      state[check.dataset.lesson] = check.checked;
    });

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn("El navegador no permitió guardar el progreso.", error);
    }
    updateProgress();
  }

  function filterLessons() {
    if (!searchInput) return;
    const query = searchInput.value.trim().toLocaleLowerCase("es");
    let visible = 0;

    lessonCards.forEach((card) => {
      const searchableText = (card.dataset.search || "") + " " + card.textContent;
      const matches = searchableText.toLocaleLowerCase("es").includes(query);
      card.hidden = !matches;
      if (matches) visible++;
    });

    if (lessonCount) {
      lessonCount.textContent = visible + (visible === 1 ? " práctica" : " prácticas");
    }
    if (emptyState) emptyState.hidden = visible !== 0;
  }

  checks.forEach((check) => check.addEventListener("change", saveProgress));
  if (searchInput) searchInput.addEventListener("input", filterLessons);

  loadProgress();
  updateProgress();
  filterLessons();

  const menuToggle = document.getElementById("menuToggle");
  const nav = document.getElementById("mainNav");

  if (menuToggle && nav) {
    menuToggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
      menuToggle.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
      menuToggle.textContent = isOpen ? "×" : "☰";
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Abrir menú");
        menuToggle.textContent = "☰";
      });
    });
  }



  // Calculadora estadística rápida: procesa números localmente en el navegador.
  const dataValuesInput = document.getElementById("dataValues");
  const calculateDataButton = document.getElementById("calculateData");
  const loadSampleDataButton = document.getElementById("loadSampleData");
  const clearDataButton = document.getElementById("clearData");
  const exportExcelButton = document.getElementById("exportExcel");
  const calculatorResults = document.getElementById("calculatorResults");
  const calculatorError = document.getElementById("calculatorError");

  const CALCULATOR_LEVEL_KEY = "datos-desde-cero-calculator-level-v1";
  let calculatorLevel = 1;
  let calculatorRouteDone = false;
  let lastAnalysis = null;
  let importedRows = null;
  let importedMatrix = null;
  let importedColumnStats = null;
  let excludeOutliersActive = false;
  try {
    const savedLevel = Number(localStorage.getItem(CALCULATOR_LEVEL_KEY));
    if (Number.isInteger(savedLevel) && savedLevel >= 1 && savedLevel <= 7) calculatorLevel = savedLevel;
    calculatorRouteDone = savedLevel === 7 && localStorage.getItem("datos-desde-cero-calculator-done-v1") === "true";
  } catch (error) { console.warn("No fue posible recuperar el nivel de la calculadora.", error); }

  function medianOf(sortedValues) {
    const middle = Math.floor(sortedValues.length / 2);
    return sortedValues.length % 2 ? sortedValues[middle] : (sortedValues[middle - 1] + sortedValues[middle]) / 2;
  }
  function formatStatistic(value) {
    if (!Number.isFinite(value)) return "No disponible";
    return new Intl.NumberFormat("es-MX", { maximumFractionDigits: 6 }).format(value);
  }
  function renderStatistic(label, value, description) {
    const card = document.createElement("article");
    card.className = "stat-result";
    const title = document.createElement("span"); title.textContent = label;
    const result = document.createElement("strong"); result.textContent = value;
    const detail = document.createElement("small"); detail.textContent = description || "";
    card.append(title, result, detail); return card;
  }
  function parseNumericInput(text) {
    return text.trim().split(/[\s,;]+/).filter(Boolean).map(token => Number(token));
  }
  function calculateData() {
    if (!dataValuesInput || !calculatorResults || !calculatorError) return;
    calculatorError.hidden = true;
    const raw = dataValuesInput.value.trim();
    if (!raw) { calculatorError.textContent = "Escribe o pega al menos un número para calcular."; calculatorError.hidden = false; return; }
    const originalValues = parseNumericInput(raw);
    if (!originalValues.length || originalValues.some(value => !Number.isFinite(value))) {
      calculatorError.textContent = "Hay un valor no válido. Usa números y punto para decimales; separa con comas, espacios o saltos de línea.";
      calculatorError.hidden = false; return;
    }
    if (originalValues.length > 100000) { calculatorError.textContent = "Introduce como máximo 100,000 valores."; calculatorError.hidden = false; return; }
    const outlierInfo = findOutliers(originalValues);
    const values = excludeOutliersActive ? originalValues.filter(value => !outlierInfo.values.includes(value)) : originalValues.slice();
    if (!values.length) { calculatorError.textContent = "La exclusión dejaría el conjunto vacío. Desactiva la opción o revisa los datos."; calculatorError.hidden = false; return; }
    const sorted = [...values].sort((a, b) => a - b);
    const count = values.length, sum = values.reduce((total, value) => total + value, 0), mean = sum / count;
    const median = medianOf(sorted), frequencies = new Map();
    values.forEach(value => frequencies.set(value, (frequencies.get(value) || 0) + 1));
    const highestFrequency = Math.max(...frequencies.values());
    const modes = highestFrequency > 1 ? [...frequencies].filter(([, f]) => f === highestFrequency).map(([v]) => v).sort((a,b)=>a-b) : [];
    const min = sorted[0], max = sorted[count - 1], range = max - min;
    const squaredDifferences = values.reduce((total, value) => total + (value - mean) ** 2, 0);
    const populationVariance = squaredDifferences / count, sampleVariance = count > 1 ? squaredDifferences / (count - 1) : null;
    const lowerHalf = sorted.slice(0, Math.floor(count / 2)), upperHalf = sorted.slice(Math.ceil(count / 2));
    const q1 = lowerHalf.length ? medianOf(lowerHalf) : null, q3 = upperHalf.length ? medianOf(upperHalf) : null;
    const results = [
      renderStatistic("Cantidad de datos", formatStatistic(count), excludeOutliersActive ? "Registros después de excluir atípicos" : "Valores analizados"),
      renderStatistic("Suma", formatStatistic(sum), "Total de todos los valores"),
      renderStatistic("Media", formatStatistic(mean), "Promedio aritmético"),
      renderStatistic("Mediana", formatStatistic(median), "Valor central ordenado"),
      renderStatistic("Moda", modes.length ? modes.map(formatStatistic).join(", ") : "Sin moda", modes.length ? "Valor(es) más frecuente(s)" : "Ningún valor se repite"),
      renderStatistic("Mínimo", formatStatistic(min), "Valor más pequeño"),
      renderStatistic("Máximo", formatStatistic(max), "Valor más grande"),
      renderStatistic("Rango", formatStatistic(range), "Máximo menos mínimo"),
      renderStatistic("Q1", q1 === null ? "No disponible" : formatStatistic(q1), "Primer cuartil"),
      renderStatistic("Q3", q3 === null ? "No disponible" : formatStatistic(q3), "Tercer cuartil"),
      renderStatistic("Varianza poblacional", formatStatistic(populationVariance), "Divide entre N"),
      renderStatistic("Desv. estándar poblacional", formatStatistic(Math.sqrt(populationVariance)), "Raíz de la varianza poblacional"),
      renderStatistic("Varianza muestral", sampleVariance === null ? "No disponible" : formatStatistic(sampleVariance), "Divide entre n − 1"),
      renderStatistic("Desv. estándar muestral", sampleVariance === null ? "No disponible" : formatStatistic(Math.sqrt(sampleVariance)), "Requiere al menos 2 datos"),
      renderStatistic("Rango intercuartílico", q1 === null || q3 === null ? "No disponible" : formatStatistic(q3 - q1), "Q3 menos Q1"),
      renderStatistic("Coeficiente de variación", mean === 0 ? "No disponible" : formatStatistic(Math.sqrt(populationVariance) / Math.abs(mean) * 100) + " %", "Dispersión relativa respecto a la media"),
      renderStatistic("Suma de cuadrados", formatStatistic(values.reduce((total, value) => total + value * value, 0)), "Suma de cada valor al cuadrado")
    ];
    calculatorResults.replaceChildren(...results);
    const sortedCard = renderStatistic("Datos ordenados", sorted.map(formatStatistic).join(" · "), "De menor a mayor");
    sortedCard.classList.add("stat-result-wide"); calculatorResults.appendChild(sortedCard);
    lastAnalysis = { values, originalValues, sorted, count, min, max, q1, q3, mean, median, populationVariance, sampleVariance };
    renderUnlockedFeatures();
  }
  function findOutliers(values) {
    const sorted = [...values].sort((a,b)=>a-b);
    if (sorted.length < 2) return { values: [], q1: null, q3: null, lower: null, upper: null, iqr: null };
    const q1 = medianOf(sorted.slice(0, Math.floor(sorted.length / 2)));
    const q3 = medianOf(sorted.slice(Math.ceil(sorted.length / 2)));
    const iqr = q3 - q1, lower = q1 - 1.5 * iqr, upper = q3 + 1.5 * iqr;
    return { values: sorted.filter(value => value < lower || value > upper), q1, q3, lower, upper, iqr };
  }
  function makeFrequencyBins(analysis) {
    const input = document.getElementById("frequencyBins");
    const requested = input ? Number(input.value) : 0;
    const k = Number.isInteger(requested) && requested >= 1 && requested <= 50 ? requested : Math.max(1, Math.min(20, Math.ceil(1 + 3.322 * Math.log10(analysis.count))));
    const width = analysis.max === analysis.min ? 1 : (analysis.max - analysis.min) / k;
    const bins = Array.from({length:k}, (_,i)=>({start:analysis.min+i*width,end:i===k-1?analysis.max:analysis.min+(i+1)*width,count:0}));
    analysis.values.forEach(value => {
      const index = analysis.max === analysis.min ? 0 : Math.min(k-1,Math.floor((value-analysis.min)/width));
      bins[index].count++;
    });
    let cumulative = 0;
    bins.forEach(bin => { cumulative += bin.count; bin.cumulative = cumulative; bin.relative = bin.count / analysis.count; });
    return bins;
  }
  function makeSvg(width, height, label) {
    const ns = "http://www.w3.org/2000/svg", svg = document.createElementNS(ns,"svg");
    svg.setAttribute("viewBox","0 0 "+width+" "+height); svg.setAttribute("role","img"); svg.setAttribute("aria-label",label); svg.classList.add("learning-svg"); return svg;
  }
  function svgNode(svg, name, attrs, text) {
    const node = document.createElementNS("http://www.w3.org/2000/svg",name);
    Object.entries(attrs || {}).forEach(([key,value])=>node.setAttribute(key,String(value)));
    if (text !== undefined) node.textContent = text;
    svg.appendChild(node); return node;
  }
  function renderFrequencyTable(analysis) {
    const target = document.getElementById("frequencyTable"); if (!target) return;
    const bins = makeFrequencyBins(analysis), table = document.createElement("table"); table.className = "learning-frequency-table";
    const thead = document.createElement("thead"), head = document.createElement("tr");
    ["Intervalo","Frecuencia absoluta (fi)","Frecuencia relativa (hi)","Acumulada (Fi)","Porcentaje"].forEach(label=>{const th=document.createElement("th");th.textContent=label;head.appendChild(th);});
    thead.appendChild(head); const tbody=document.createElement("tbody");
    bins.forEach((bin,index)=>{const row=document.createElement("tr");const end=index===bins.length-1?"]":")";
      ["["+formatStatistic(bin.start)+", "+formatStatistic(bin.end)+end,String(bin.count),formatStatistic(bin.relative),String(bin.cumulative),formatStatistic(bin.relative*100)+"%"].forEach(value=>{const td=document.createElement("td");td.textContent=value;row.appendChild(td);});tbody.appendChild(row);});
    table.append(thead,tbody); target.replaceChildren(table);
  }
  function renderHistogram(analysis,bins) {
    const target=document.getElementById("dataHistogram"); if(!target)return;
    const max=Math.max(1,...bins.map(b=>b.count)),svg=makeSvg(620,220,"Histograma de frecuencias"),left=42,base=175,plotW=550,barW=plotW/bins.length;
    svgNode(svg,"line",{x1:left,y1:base,x2:600,y2:base,class:"chart-axis"});
    bins.forEach((bin,i)=>{const h=bin.count/max*135,x=left+i*barW+1;svgNode(svg,"rect",{x,y:base-h,width:Math.max(1,barW-2),height:h,rx:2,class:"chart-bar"});svgNode(svg,"text",{x:x+barW/2,y:base+17,"text-anchor":"middle",class:"chart-label"},formatStatistic(bin.start));svgNode(svg,"text",{x:x+barW/2,y:base-h-5,"text-anchor":"middle",class:"chart-value"},String(bin.count));});
    target.replaceChildren(svg);
  }
  function renderFrequencyBars(analysis,bins) {
    const target=document.getElementById("frequencyBars");if(!target)return;
    const max=Math.max(1,...bins.map(b=>b.count)),svg=makeSvg(620,220,"Gráfica de barras de frecuencias");
    bins.forEach((bin,i)=>{const y=12+i* Math.min(35,195/bins.length),w=bin.count/max*450;svgNode(svg,"text",{x:5,y:y+14,class:"chart-label"},formatStatistic(bin.start));svgNode(svg,"rect",{x:105,y,width:w,height:22,rx:3,class:"chart-bar"});svgNode(svg,"text",{x:112+w,y:y+15,class:"chart-value"},String(bin.count));});
    target.replaceChildren(svg);
  }
  function renderFrequencyPolygon(analysis,bins) {
    const target=document.getElementById("frequencyPolygon");if(!target)return;
    const max=Math.max(1,...bins.map(b=>b.count)),svg=makeSvg(620,220,"Polígono de frecuencias"),points=bins.map((bin,i)=>({x:45+(i+.5)*530/bins.length,y:178-bin.count/max*140}));
    svgNode(svg,"line",{x1:40,y1:180,x2:590,y2:180,class:"chart-axis"});
    svgNode(svg,"polyline",{points:points.map(p=>p.x+","+p.y).join(" "),class:"chart-line",fill:"none"});
    points.forEach((p,i)=>{svgNode(svg,"circle",{cx:p.x,cy:p.y,r:4,class:"chart-dot"});svgNode(svg,"text",{x:p.x,y:198,"text-anchor":"middle",class:"chart-label"},formatStatistic((bins[i].start+bins[i].end)/2));});
    target.replaceChildren(svg);
  }
  function renderBoxPlot(analysis) {
    const target=document.getElementById("boxPlot");if(!target)return;
    const out=findOutliers(analysis.values),min=analysis.min,max=analysis.max,span=max-min||1,scale=v=>35+(v-min)/span*540,svg=makeSvg(620,150,"Diagrama de caja y bigotes");
    const y=72;svgNode(svg,"line",{x1:scale(min),y1:y,x2:scale(max),y2:y,class:"chart-line"});
    [min,max].forEach(v=>svgNode(svg,"line",{x1:scale(v),x2:scale(v),y1:y-12,y2:y+12,class:"chart-axis"}));
    if(out.q1!==null){svgNode(svg,"rect",{x:scale(out.q1),y:y-24,width:Math.max(2,scale(out.q3)-scale(out.q1)),height:48,rx:3,class:"chart-box"});svgNode(svg,"line",{x1:scale(analysis.median),x2:scale(analysis.median),y1:y-24,y2:y+24,class:"chart-median"});}
    [min,out.q1,analysis.median,out.q3,max].filter(Number.isFinite).forEach(v=>svgNode(svg,"text",{x:scale(v),y:115,"text-anchor":"middle",class:"chart-label"},formatStatistic(v)));
    out.values.forEach(v=>svgNode(svg,"circle",{cx:scale(v),cy:y,r:5,class:"chart-outlier"}));
    target.replaceChildren(svg);
  }
  function renderOutliers(analysis) {
    const target=document.getElementById("outlierResults");if(!target)return;
    const info=findOutliers(analysis.originalValues);
    const p=document.createElement("p");p.textContent=info.iqr===null?"Se necesitan al menos dos datos para calcular los cuartiles.":"Límites: "+formatStatistic(info.lower)+" a "+formatStatistic(info.upper)+". RIC: "+formatStatistic(info.iqr)+".";
    const strong=document.createElement("strong");strong.className="outlier-count";strong.textContent=info.values.length+(info.values.length===1?" posible valor atípico":" posibles valores atípicos");
    const vals=document.createElement("p");vals.textContent=info.values.length?"Valores a revisar: "+info.values.map(formatStatistic).join(", "):"No se detectaron valores fuera de los límites.";
    const note=document.createElement("small");note.textContent="Se muestran todas las apariciones. Investiga cada caso antes de excluirlo; un atípico puede ser válido.";
    target.replaceChildren(p,strong,vals,note);
  }
  function renderUnlockedFeatures() {
    const cards=[...document.querySelectorAll("[data-stage-card]")];
    cards.forEach(card=>{card.hidden=Number(card.dataset.stageCard)>calculatorLevel;});
    if(!lastAnalysis)return;
    if(calculatorLevel>=2)renderFrequencyTable(lastAnalysis);
    if(calculatorLevel>=3){const bins=makeFrequencyBins(lastAnalysis);renderHistogram(lastAnalysis,bins);renderFrequencyBars(lastAnalysis,bins);renderFrequencyPolygon(lastAnalysis,bins);renderBoxPlot(lastAnalysis);}
    if(calculatorLevel>=4)renderOutliers(lastAnalysis);
  }
  function renderCalculatorProgress() {
    const titles=["Estadística descriptiva","Tabla de frecuencias","Gráficas automáticas","Valores atípicos","Limpieza de datos","Análisis de dos variables","Modo aprendizaje"];
    const level=document.getElementById("calculatorLevel"),label=document.getElementById("calculatorLevelText"),fill=document.getElementById("calculatorLearningFill");
    if(level)level.textContent="Nivel "+calculatorLevel+" de 7";
    if(label)label.textContent=calculatorRouteDone?"Laboratorio completado":titles[calculatorLevel-1];
    if(fill)fill.style.width=(calculatorRouteDone?100:(calculatorLevel-1)/6*100)+"%";
    document.querySelectorAll("[data-stage-card]").forEach(card=>{card.hidden=Number(card.dataset.stageCard)>calculatorLevel;});
    document.querySelectorAll("[data-complete-stage]").forEach(button=>{
      const stage=Number(button.dataset.completeStage);button.hidden=stage!==calculatorLevel;button.disabled=stage===7&&calculatorRouteDone;
      if(stage===7&&calculatorRouteDone)button.textContent="Laboratorio completado ✓";
    });
    renderUnlockedFeatures();
  }
  document.querySelectorAll("[data-complete-stage]").forEach(button=>button.addEventListener("click",()=>{
    if(Number(button.dataset.completeStage)!==calculatorLevel)return;
    if(calculatorLevel<7)calculatorLevel++;else calculatorRouteDone=true;
    try{localStorage.setItem(CALCULATOR_LEVEL_KEY,String(calculatorLevel));if(calculatorRouteDone)localStorage.setItem("datos-desde-cero-calculator-done-v1","true");}catch(error){console.warn("No fue posible guardar el progreso.",error);}
    renderCalculatorProgress();const next=document.querySelector('[data-stage-card="'+calculatorLevel+'"]');if(next)next.scrollIntoView({behavior:"smooth",block:"nearest"});
  }));
  renderCalculatorProgress();

  const updateFrequencyButton=document.getElementById("updateFrequencyBins");
  if(updateFrequencyButton)updateFrequencyButton.addEventListener("click",()=>{if(lastAnalysis)renderFrequencyTable(lastAnalysis);});
  const applyOutlierButton=document.getElementById("applyOutlierChoice");
  if(applyOutlierButton)applyOutlierButton.addEventListener("click",()=>{excludeOutliersActive=!!document.getElementById("excludeOutliers")?.checked;calculateData();});
  const qualityButton=document.getElementById("inspectDataQuality"),qualityTarget=document.getElementById("dataQualityReport");
  function inspectQuality() {
    if(!qualityTarget||!dataValuesInput)return;
    const raw=dataValuesInput.value,parts=raw.split(/[,;\n\r]+/).map(v=>v.trim()),nonempty=parts.filter(Boolean),blank=parts.filter(v=>!v).length;
    const numeric=nonempty.filter(v=>Number.isFinite(Number(v))),invalid=nonempty.filter(v=>!Number.isFinite(Number(v)));
    const counts=new Map();numeric.forEach(v=>counts.set(v,(counts.get(v)||0)+1));
    const duplicates=[...counts].filter(([,n])=>n>1).reduce((sum,[,n])=>sum+n-1,0);
    const report=document.createElement("div");report.className="quality-metrics";
    [["Registros no vacíos",nonempty.length],["Campos vacíos detectados",blank],["Entradas no numéricas",invalid.length],["Registros duplicados",duplicates]].forEach(([label,value])=>{const item=document.createElement("p");item.textContent=label+": "+value;report.appendChild(item);});
    if(invalid.length){const detail=document.createElement("p");detail.textContent="Entradas a revisar: "+invalid.slice(0,12).join(", ")+(invalid.length>12?"…":"");report.appendChild(detail);}
    if(importedColumnStats){const note=document.createElement("p");note.textContent="Archivo importado: "+importedRows+" filas · columna: "+importedColumnStats.name+" · vacíos: "+importedColumnStats.blank+" · no numéricos: "+importedColumnStats.invalid+".";report.appendChild(note);}
    qualityTarget.replaceChildren(report);
  }
  if(qualityButton)qualityButton.addEventListener("click",inspectQuality);
  const removeDuplicatesButton=document.getElementById("removeDuplicates");
  if(removeDuplicatesButton)removeDuplicatesButton.addEventListener("click",()=>{
    if(!dataValuesInput)return;const tokens=dataValuesInput.value.trim().split(/[\s,;]+/).filter(Boolean),seen=new Set(),unique=[];
    tokens.forEach(token=>{const number=Number(token);const key=Number.isFinite(number)?String(number):"invalid:"+token;if(!seen.has(key)){seen.add(key);unique.push(token);}});
    const removed=tokens.length-unique.length;dataValuesInput.value=unique.join(", ");inspectQuality();if(removed&&calculatorError){calculatorError.textContent="Se eliminaron "+removed+" registros duplicados. Revisa y vuelve a calcular.";calculatorError.hidden=false;}calculateData();
  });
  const dataFileInput=document.getElementById("dataFile"),importColumnSelect=document.getElementById("importColumn");
  function importSelectedColumn() {
    if(!importedMatrix||!importColumnSelect||!dataValuesInput)return;
    const column=Number(importColumnSelect.value),header=importedMatrix[0]||[];
    const cells=importedMatrix.slice(1).map(row=>row[column]===undefined?"":String(row[column]).trim());
    const blank=cells.filter(value=>value==="").length,invalid=cells.filter(value=>value!==""&&!Number.isFinite(Number(value))).length;
    const numeric=cells.filter(value=>value!==""&&Number.isFinite(Number(value))).map(Number);
    if(!numeric.length){if(calculatorError){calculatorError.textContent="La columna seleccionada no contiene valores numéricos.";calculatorError.hidden=false;}return;}
    importedRows=cells.length;importedColumnStats={name:String(header[column]||("Columna "+(column+1))),blank,invalid};
    dataValuesInput.value=numeric.join(", ");excludeOutliersActive=false;calculateData();inspectQuality();
    if(calculatorError){calculatorError.textContent="Se importaron "+numeric.length+" valores numéricos de la columna «"+importedColumnStats.name+"».";calculatorError.hidden=false;}
  }
  if(importColumnSelect)importColumnSelect.addEventListener("change",importSelectedColumn);
  if(dataFileInput)dataFileInput.addEventListener("change",async()=>{
    const file=dataFileInput.files&&dataFileInput.files[0];if(!file)return;
    try{
      let rows=[];
      if(/\.xlsx?$/i.test(file.name)){
        if(!window.XLSX)throw new Error("No se pudo cargar el lector Excel. Guarda el archivo como CSV e inténtalo de nuevo.");
        const buffer=await file.arrayBuffer(),workbook=XLSX.read(buffer,{type:"array"}),sheet=workbook.Sheets[workbook.SheetNames[0]];
        rows=XLSX.utils.sheet_to_json(sheet,{header:1,defval:""});
      }else{
        const text=await file.text();rows=text.replace(/^\uFEFF/,"").split(/\r?\n/).filter(Boolean).map(line=>line.split(","));
      }
      if(rows.length<2)throw new Error("El archivo necesita una fila de encabezados y al menos un registro.");
      importedMatrix=rows;const header=rows[0],numericColumns=[];
      header.forEach((name,index)=>{
        const cells=rows.slice(1).map(row=>String(row[index]??"").trim()).filter(value=>value!=="");
        const valid=cells.filter(value=>Number.isFinite(Number(value))).length;
        if(valid>0)numericColumns.push({index,name:String(name||("Columna "+(index+1))),valid});
      });
      if(!numericColumns.length)throw new Error("No encontré columnas numéricas en la primera hoja del archivo.");
      if(importColumnSelect){
        importColumnSelect.replaceChildren();
        numericColumns.forEach(column=>{const option=document.createElement("option");option.value=String(column.index);option.textContent=column.name+" ("+column.valid+" valores numéricos)";importColumnSelect.appendChild(option);});
        importColumnSelect.disabled=false;
      }
      importSelectedColumn();
    }catch(error){if(calculatorError){calculatorError.textContent=error.message||"No fue posible leer el archivo.";calculatorError.hidden=false;}}
  });

  function analyzePairs() {
    const xInput=document.getElementById("variableX"),yInput=document.getElementById("variableY"),target=document.getElementById("bivariateResults"),plot=document.getElementById("scatterPlot");
    if(!xInput||!yInput||!target||!plot)return;
    const x=parseNumericInput(xInput.value),y=parseNumericInput(yInput.value);
    if(!x.length||x.length!==y.length||x.some(v=>!Number.isFinite(v))||y.some(v=>!Number.isFinite(v))){target.textContent="Ingresa dos listas numéricas válidas con exactamente la misma cantidad de valores y en el mismo orden.";return;}
    if(x.length<2){target.textContent="Se requieren al menos dos pares de observaciones.";return;}
    const mx=x.reduce((a,b)=>a+b,0)/x.length,my=y.reduce((a,b)=>a+b,0)/y.length;
    const ssx=x.reduce((s,v)=>s+(v-mx)**2,0),ssy=y.reduce((s,v)=>s+(v-my)**2,0),cross=x.reduce((s,v,i)=>s+(v-mx)*(y[i]-my),0);
    const covariance=cross/(x.length-1),pearson=ssx&&ssy?cross/Math.sqrt(ssx*ssy):null,slope=ssx?cross/ssx:null,intercept=slope===null?null:my-slope*mx,r2=pearson===null?null:pearson**2;
    const cards=[["Pares",x.length],["Covarianza muestral",formatStatistic(covariance)],["Correlación de Pearson (r)",pearson===null?"No definida":formatStatistic(pearson)],["Pendiente (b)",slope===null?"No definida":formatStatistic(slope)],["Intercepto (a)",intercept===null?"No definida":formatStatistic(intercept)],["Coeficiente R²",r2===null?"No definido":formatStatistic(r2)]];
    const wrapper=document.createElement("div");wrapper.className="pair-results";
    cards.forEach(([label,value])=>{const p=document.createElement("p");p.textContent=label+": "+value;wrapper.appendChild(p);});
    const interpretation=document.createElement("p");interpretation.textContent=pearson===null?"La correlación no se define si alguna variable no tiene variación.":Math.abs(pearson)<.3?"Relación lineal débil en esta muestra.":Math.abs(pearson)<.7?"Relación lineal moderada en esta muestra.":"Relación lineal fuerte en esta muestra.";wrapper.appendChild(interpretation);
    const equation=document.createElement("p");equation.textContent=slope===null?"No se puede ajustar una recta.":"Modelo: ŷ = "+formatStatistic(intercept)+" + ("+formatStatistic(slope)+")X";wrapper.appendChild(equation);target.replaceChildren(wrapper);
    const svg=makeSvg(620,300,"Diagrama de dispersión de X y Y"),xmin=Math.min(...x),xmax=Math.max(...x),ymin=Math.min(...y),ymax=Math.max(...y),sx=v=>45+(v-xmin)/(xmax-xmin||1)*535,sy=v=>255-(v-ymin)/(ymax-ymin||1)*220;
    svgNode(svg,"line",{x1:45,y1:255,x2:590,y2:255,class:"chart-axis"});svgNode(svg,"line",{x1:45,y1:20,x2:45,y2:255,class:"chart-axis"});
    x.forEach((v,i)=>svgNode(svg,"circle",{cx:sx(v),cy:sy(y[i]),r:5,class:"chart-dot"}));
    if(slope!==null){const y1=intercept+slope*xmin,y2=intercept+slope*xmax;svgNode(svg,"line",{x1:sx(xmin),y1:sy(y1),x2:sx(xmax),y2:sy(y2),class:"chart-regression"});}
    plot.replaceChildren(svg);
  }
  const pairButton=document.getElementById("analyzePairs");if(pairButton)pairButton.addEventListener("click",analyzePairs);

  if (exportExcelButton) exportExcelButton.addEventListener("click", () => {
    if (!dataValuesInput || !calculatorResults || !calculatorError) return;
    calculatorError.hidden = true;
    const raw = dataValuesInput.value.trim();
    const tokens = raw.split(/[\s,;]+/).filter(Boolean);
    const values = tokens.map(Number);
    if (!raw || !values.length || values.some(value => !Number.isFinite(value)) || values.length > 100000) {
      calculatorError.textContent = !raw
        ? "Primero introduce tus datos para generar el archivo."
        : "Revisa los datos: deben ser números válidos y no superar 100,000 valores.";
      calculatorError.hidden = false;
      return;
    }
    if (!calculatorResults.querySelector(".stat-result")) calculateData();
    const cards = [...calculatorResults.querySelectorAll(".stat-result")];
    if (!cards.length) return;
    const summary = [["Indicador", "Resultado", "Descripción"]];
    cards.forEach(card => {
      const parts = card.querySelectorAll("span, strong, small");
      summary.push([parts[0].textContent, parts[1].textContent, parts[2].textContent]);
    });
    const original = [["N.º", "Valor"], ...values.map((value, index) => [index + 1, value])];
    const ordered = [["Posición", "Valor ordenado"], ...[...values].sort((a, b) => a - b).map((value, index) => [index + 1, value])];
    const stamp = new Date().toISOString().slice(0, 10);
    if (window.XLSX && XLSX.utils && XLSX.writeFile) {
      const workbook = XLSX.utils.book_new();
      const sheets = [
        ["Datos originales", original, [{ wch: 10 }, { wch: 18 }]],
        ["Resumen estadístico", summary, [{ wch: 32 }, { wch: 24 }, { wch: 42 }]],
        ["Datos ordenados", ordered, [{ wch: 14 }, { wch: 20 }]]
      ];
      if (lastAnalysis) {
        const bins = makeFrequencyBins(lastAnalysis);
        const frequencyRows = [["Intervalo", "Frecuencia absoluta", "Frecuencia relativa", "Frecuencia acumulada", "Porcentaje"]];
        bins.forEach(bin => frequencyRows.push([
          "[" + bin.start + ", " + bin.end + "]", bin.count, bin.relative, bin.cumulative, bin.relative * 100
        ]));
        sheets.push(["Frecuencias", frequencyRows, [{ wch: 28 }, { wch: 20 }, { wch: 22 }, { wch: 24 }, { wch: 16 }]]);
      }
      sheets.forEach(([name, rows, widths]) => {
        const sheet = XLSX.utils.aoa_to_sheet(rows);
        sheet["!cols"] = widths;
        if (name !== "Resumen estadístico") sheet["!autofilter"] = { ref: "A1:B" + rows.length };
        XLSX.utils.book_append_sheet(workbook, sheet, name);
      });
      XLSX.writeFile(workbook, "analisis_de_datos_" + stamp + ".xlsx");
      return;
    }
    // Respaldo compatible con Excel si la biblioteca XLSX no carga.
    const csvRows = [
      ["DATOS ORIGINALES"], ...original, [],
      ["RESUMEN ESTADÍSTICO"], ...summary, [],
      ["DATOS ORDENADOS"], ...ordered
    ];
    const csv = "\uFEFF" + csvRows.map(row => row.map(value => {
      const cell = String(value ?? "").replace(/"/g, '""');
      return '"' + cell + '"';
    }).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "analisis_de_datos_" + stamp + ".csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  });

  const copyDataResultsButton = document.getElementById("copyDataResults");
  if (copyDataResultsButton && calculatorResults) copyDataResultsButton.addEventListener("click", async () => {
    const cards = [...calculatorResults.querySelectorAll(".stat-result")];
    if (!cards.length) {
      if (calculatorError) {
        calculatorError.textContent = "Primero calcula tus datos para poder copiar los resultados.";
        calculatorError.hidden = false;
      }
      return;
    }
    const summary = cards.map(card => {
      const parts = card.querySelectorAll("span, strong, small");
      return parts[0].textContent + ": " + parts[1].textContent + (parts[2].textContent ? " (" + parts[2].textContent + ")" : "");
    }).join("\n");
    try {
      await navigator.clipboard.writeText(summary);
      copyDataResultsButton.textContent = "Copiado";
      window.setTimeout(() => { copyDataResultsButton.textContent = "Copiar resultados"; }, 1800);
    } catch (error) {
      if (calculatorError) {
        calculatorError.textContent = "No se pudo copiar automáticamente. Selecciona los resultados y cópialos manualmente.";
        calculatorError.hidden = false;
      }
    }
  });

  if (calculateDataButton) calculateDataButton.addEventListener("click", calculateData);
  if (dataValuesInput) dataValuesInput.addEventListener("keydown", event => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") calculateData();
  });
  if (loadSampleDataButton && dataValuesInput) loadSampleDataButton.addEventListener("click", () => {
    dataValuesInput.value = "12, 15, 18, 18, 20, 22, 25";
    calculateData();
  });
  if (clearDataButton && dataValuesInput && calculatorResults) clearDataButton.addEventListener("click", () => {
    dataValuesInput.value = "";
    calculatorResults.replaceChildren();
    const empty = document.createElement("div");
    empty.className = "calculator-empty";
    empty.textContent = "Tus resultados aparecerán aquí cuando ingreses datos.";
    calculatorResults.appendChild(empty);
    lastAnalysis = null;
    excludeOutliersActive = false;
    const exclusionToggle = document.getElementById("excludeOutliers");
    if (exclusionToggle) exclusionToggle.checked = false;
    ["frequencyTable","dataHistogram","boxPlot","frequencyBars","frequencyPolygon","outlierResults"].forEach(id => { const node = document.getElementById(id); if (node) node.replaceChildren(); });
    if (calculatorError) calculatorError.hidden = true;
    dataValuesInput.focus();
  });

  // Organizador semanal: las sesiones se guardan solo en este navegador.
  const PLANNER_KEY = "ciencia-datos-plan-semanal-v1";
  const plannerForm = document.getElementById("studyPlannerForm");
  const plannerList = document.getElementById("plannerList");
  const plannedTime = document.getElementById("plannedTime");
  const completedTime = document.getElementById("completedTime");
  const pendingCount = document.getElementById("pendingCount");
  const plannerProgressFill = document.getElementById("plannerProgressFill");
  const plannerProgressText = document.getElementById("plannerProgressText");
  const plannerDays = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  let studySessions = [];

  function savePlanner() {
    try { localStorage.setItem(PLANNER_KEY, JSON.stringify(studySessions)); }
    catch (error) { console.warn("No fue posible guardar el plan semanal.", error); }
  }

  function renderPlanner() {
    if (!plannerList) return;
    const total = studySessions.reduce((sum, item) => sum + item.minutes, 0);
    const done = studySessions.filter(item => item.done).reduce((sum, item) => sum + item.minutes, 0);
    const completedCount = studySessions.filter(item => item.done).length;
    const pending = studySessions.length - completedCount;
    if (plannedTime) plannedTime.textContent = (total / 60).toLocaleString("es-MX", { maximumFractionDigits: 1 }) + " h";
    if (completedTime) completedTime.textContent = done + " min";
    if (pendingCount) pendingCount.textContent = String(pending);
    const percent = total ? Math.round(done / total * 100) : 0;
    if (plannerProgressFill) plannerProgressFill.style.width = percent + "%";
    if (plannerProgressText) plannerProgressText.textContent = studySessions.length ? percent + "% del tiempo planeado completado" : "Aún no hay sesiones";
    plannerList.replaceChildren();
    if (!studySessions.length) {
      const empty = document.createElement("p");
      empty.className = "planner-empty";
      empty.textContent = "Todavía no tienes sesiones. Agrega la primera para empezar a organizarte.";
      plannerList.appendChild(empty);
      return;
    }
    plannerDays.forEach(day => {
      const sessions = studySessions.filter(item => item.day === day);
      if (!sessions.length) return;
      const group = document.createElement("section");
      group.className = "planner-day";
      const heading = document.createElement("h4");
      heading.textContent = day;
      group.appendChild(heading);
      sessions.forEach(item => {
        const row = document.createElement("article");
        row.className = "planner-session" + (item.done ? " is-done" : "");
        const label = document.createElement("label");
        label.className = "planner-session-label";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = item.done;
        checkbox.setAttribute("aria-label", "Marcar como completada: " + item.task);
        checkbox.addEventListener("change", () => {
          item.done = checkbox.checked;
          savePlanner();
          renderPlanner();
        });
        const title = document.createElement("span");
        title.textContent = item.task;
        label.append(checkbox, title);
        const duration = document.createElement("span");
        duration.className = "planner-duration";
        duration.textContent = item.minutes >= 60 ? (item.minutes / 60).toLocaleString("es-MX", { maximumFractionDigits: 1 }) + " h" : item.minutes + " min";
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "planner-remove";
        remove.textContent = "Quitar";
        remove.setAttribute("aria-label", "Quitar sesión: " + item.task);
        remove.addEventListener("click", () => {
          studySessions = studySessions.filter(session => session.id !== item.id);
          savePlanner();
          renderPlanner();
        });
        row.append(label, duration, remove);
        group.appendChild(row);
      });
      plannerList.appendChild(group);
    });
  }

  if (plannerForm) {
    try {
      const saved = JSON.parse(localStorage.getItem(PLANNER_KEY) || "[]");
      if (Array.isArray(saved)) studySessions = saved.filter(item =>
        item && typeof item.id === "string" && typeof item.task === "string" &&
        plannerDays.includes(item.day) && Number.isFinite(item.minutes) &&
        item.minutes > 0 && typeof item.done === "boolean"
      );
    } catch (error) {
      console.warn("No fue posible recuperar el plan semanal.", error);
    }
    plannerForm.addEventListener("submit", event => {
      event.preventDefault();
      const taskInput = document.getElementById("studyTask");
      const dayInput = document.getElementById("studyDay");
      const minutesInput = document.getElementById("studyMinutes");
      const task = taskInput.value.trim();
      const minutes = Number(minutesInput.value);
      if (!task || !plannerDays.includes(dayInput.value) || ![25, 50, 75, 100, 120].includes(minutes)) return;
      studySessions.push({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        task, day: dayInput.value, minutes, done: false
      });
      savePlanner();
      renderPlanner();
      plannerForm.reset();
      taskInput.focus();
    });
    renderPlanner();
  }


  // Portafolio: registra entregables localmente sin enviar datos a servidores.
  const PROJECT_KEY = "datos-desde-cero-projects-v1";
  const projectChecks = [...document.querySelectorAll("[data-project-task]")];
  const projectDone = document.getElementById("projectTasksDone");
  const projectText = document.getElementById("projectTasksText");
  const projectFill = document.getElementById("projectTasksFill");
  function renderProjectProgress() {
    const done = projectChecks.filter(input => input.checked).length;
    const total = projectChecks.length;
    if (projectDone) projectDone.textContent = done + " de " + total + " entregables";
    if (projectText) projectText.textContent = done === total && total ? "¡Portafolio inicial completado!" : done ? "Sigue con el siguiente entregable; guarda evidencia en tu repositorio." : "Comienza con el primer proyecto.";
    if (projectFill) projectFill.style.width = (total ? done / total * 100 : 0) + "%";
  }
  try {
    const savedProjects = JSON.parse(localStorage.getItem(PROJECT_KEY) || "{}");
    projectChecks.forEach(input => { input.checked = savedProjects[input.dataset.projectTask] === true; });
  } catch (error) { console.warn("No fue posible recuperar el avance de proyectos.", error); }
  projectChecks.forEach(input => input.addEventListener("change", () => {
    const state = {};
    projectChecks.forEach(item => { state[item.dataset.projectTask] = item.checked; });
    try { localStorage.setItem(PROJECT_KEY, JSON.stringify(state)); } catch (error) { console.warn("No fue posible guardar el avance de proyectos.", error); }
    renderProjectProgress();
  }));
  renderProjectProgress();

  // Biblioteca: combina búsqueda de texto y filtro por área.
  const resourceSearch = document.getElementById("resourceSearch");
  const resourceCards = [...document.querySelectorAll(".resource-card")];
  const resourceCount = document.getElementById("resourceCount");
  const resourceEmpty = document.getElementById("resourceEmpty");
  let resourceCategory = "todos";
  function filterResources() {
    const query = resourceSearch ? resourceSearch.value.trim().toLocaleLowerCase("es") : "";
    let visible = 0;
    resourceCards.forEach(card => {
      const haystack = (card.dataset.resourceSearch || "") + " " + card.textContent;
      const matchesText = haystack.toLocaleLowerCase("es").includes(query);
      const matchesCategory = resourceCategory === "todos" || card.dataset.resourceCategory === resourceCategory;
      card.hidden = !(matchesText && matchesCategory);
      if (!card.hidden) visible++;
    });
    if (resourceCount) resourceCount.textContent = visible + (visible === 1 ? " recurso" : " recursos");
    if (resourceEmpty) resourceEmpty.hidden = visible !== 0;
  }
  if (resourceSearch) resourceSearch.addEventListener("input", filterResources);
  document.querySelectorAll("[data-resource-filter]").forEach(button => button.addEventListener("click", () => {
    resourceCategory = button.dataset.resourceFilter;
    document.querySelectorAll("[data-resource-filter]").forEach(item => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    filterResources();
  }));
  filterResources();

  // Reto de conocimientos con retroalimentación por pregunta.
  const quiz = document.getElementById("knowledgeQuiz");
  if (quiz) {
    const answers = {
      q1: ["b", "Correcto: while repite el bloque mientras la condición sea verdadera."],
      q2: ["b", "Correcto: la mediana depende de la posición central y resiste mejor valores extremos."],
      q3: ["c", "Correcto: GROUP BY agrupa registros para calcular resúmenes por categoría."],
      q4: ["a", "Correcto: el conjunto de prueba permite estimar el desempeño en datos no usados para ajustar el modelo."],
      q5: ["b", "Correcto: correlación describe asociación; por sí sola no demuestra causalidad."]
    };
    const score = document.getElementById("quizScore");
    quiz.addEventListener("submit", event => {
      event.preventDefault();
      let points = 0, answered = 0;
      Object.entries(answers).forEach(([name, data]) => {
        const selected = quiz.querySelector('input[name="' + name + '"]:checked');
        const feedback = document.getElementById("feedback" + name.slice(1));
        if (!feedback) return;
        feedback.classList.remove("correct", "incorrect");
        if (!selected) {
          feedback.textContent = "Sin responder. " + data[1].replace("Correcto: ", "");
          feedback.classList.add("incorrect");
          return;
        }
        answered++;
        if (selected.value === data[0]) { points++; feedback.textContent = data[1]; feedback.classList.add("correct"); }
        else { feedback.textContent = "No es la opción correcta. " + data[1].replace("Correcto: ", "La respuesta correcta es: "); feedback.classList.add("incorrect"); }
      });
      if (score) score.textContent = points + " de 5 correctas · " + (answered === 5 ? (points >= 4 ? "¡Buen dominio!" : "Repasa los temas y vuelve a intentarlo.") : "Responde todas para completar el reto.");
    });
    quiz.addEventListener("reset", () => {
      window.setTimeout(() => {
        document.querySelectorAll(".quiz-feedback").forEach(node => { node.textContent = ""; node.classList.remove("correct", "incorrect"); });
        if (score) score.textContent = "Aún no has enviado tus respuestas.";
      }, 0);
    });
  }


  // Mini-lecciones guiadas: concepto, ejemplo trabajado, reto y solución comentada.
  const miniLessons = {
    "python-variables": {
      concept: "Una variable es un nombre asociado a un valor. El tipo indica qué clase de dato guardas: entero (int), decimal (float), texto (str) o verdadero/falso (bool).",
      example: 'edad = 20\nnombre = "Ana"\naltura = 1.65\nes_estudiante = True\nprint(nombre, edad)',
      explain: "Python asocia cada nombre con un valor. Puedes consultar su tipo con type(edad).",
      challenge: "Crea producto = \"Cuaderno\", precio = 35 y cantidad = 3. Calcula el total y muestra una frase con el resultado.",
      solution: 'producto = "Cuaderno"\nprecio = 35\ncantidad = 3\ntotal = precio * cantidad\nprint(f"{producto}: {total} pesos")'
    },
    "python-condicionales": {
      concept: "Una condición permite que el programa elija qué instrucciones ejecutar. if evalúa la primera condición; elif prueba alternativas y else cubre los demás casos.",
      example: 'calificacion = 8\nif calificacion >= 9:\n    print("Excelente")\nelif calificacion >= 6:\n    print("Aprobado")\nelse:\n    print("Necesita apoyo")',
      explain: "Las condiciones se evalúan de arriba hacia abajo. En cuanto una resulta verdadera, se ejecuta ese bloque y se omiten los siguientes.",
      challenge: "Escribe una condición que indique si una persona puede votar cuando tiene 18 años o más. Prueba con edades 16 y 21.",
      solution: 'edad = 21\nif edad >= 18:\n    print("Puede votar")\nelse:\n    print("Aún no cumple la edad")'
    },
    "python-ciclos": {
      concept: "Un ciclo repite instrucciones. for recorre elementos de una colección o secuencia; while repite mientras una condición siga siendo verdadera.",
      example: 'calificaciones = [8, 9, 7]\nfor nota in calificaciones:\n    print(nota)\n\nfor numero in range(1, 4):\n    print(numero)',
      explain: "range(1, 4) produce 1, 2 y 3: el límite final no se incluye. Cada vuelta asigna el siguiente valor a la variable.",
      challenge: "Usa un ciclo para sumar los números del 1 al 5 y mostrar el total.",
      solution: 'total = 0\nfor numero in range(1, 6):\n    total += numero\nprint(total)  # 15'
    },
    "python-funciones": {
      concept: "Una función agrupa instrucciones con un nombre para reutilizarlas. Los parámetros reciben datos y return devuelve un resultado al lugar donde se llamó.",
      example: 'def calcular_promedio(a, b):\n    return (a + b) / 2\n\nresultado = calcular_promedio(8, 10)\nprint(resultado)  # 9.0',
      explain: "La función no se ejecuta al definirla, sino cuando la llamas. return entrega el resultado; print solo lo muestra.",
      challenge: "Crea una función llamada area_rectangulo que reciba base y altura, y devuelva su producto.",
      solution: 'def area_rectangulo(base, altura):\n    return base * altura\n\nprint(area_rectangulo(4, 3))  # 12'
    },
    "numpy": {
      concept: "NumPy trabaja con arreglos numéricos. Sus operaciones se aplican elemento a elemento y permiten procesar muchos valores sin escribir ciclos manuales.",
      example: 'import numpy as np\nventas = np.array([10, 12, 8])\nventas_con_iva = ventas * 1.16\nprint(ventas.mean())  # 10.0',
      explain: "El arreglo guarda valores en una estructura homogénea. mean() calcula el promedio y la multiplicación escala cada elemento.",
      challenge: "Crea un arreglo con [5, 10, 15] y calcula su suma y su promedio.",
      solution: 'import numpy as np\ndatos = np.array([5, 10, 15])\nprint(datos.sum())   # 30\nprint(datos.mean())  # 10.0'
    },
    "pandas": {
      concept: "Pandas organiza datos tabulares en un DataFrame: filas para observaciones y columnas para variables. Puedes inspeccionar, filtrar y resumir una tabla.",
      example: 'import pandas as pd\ndf = pd.DataFrame({"producto": ["A", "B"], "ventas": [10, 15]})\nprint(df.head())\nprint(df["ventas"].mean())',
      explain: "head() muestra las primeras filas. Seleccionar df[\"ventas\"] devuelve una serie; mean() calcula su promedio.",
      challenge: "Con un DataFrame que tenga una columna precio, muestra solo las filas cuyo precio sea mayor que 100.",
      solution: 'caros = df[df["precio"] > 100]\nprint(caros)'
    },
    "sql": {
      concept: "SQL consulta tablas. SELECT elige columnas, FROM indica la tabla, WHERE filtra filas y GROUP BY agrupa registros para calcular resúmenes.",
      example: "SELECT categoria, COUNT(*) AS productos\nFROM inventario\nWHERE existencia > 0\nGROUP BY categoria\nORDER BY productos DESC;",
      explain: "Primero se filtran los registros disponibles, después se agrupan por categoría y se cuenta cuántos productos hay en cada grupo.",
      challenge: "Imagina una tabla ventas con columna ciudad. Escribe una consulta que cuente cuántas ventas hay por ciudad.",
      solution: "SELECT ciudad, COUNT(*) AS total_ventas\nFROM ventas\nGROUP BY ciudad\nORDER BY total_ventas DESC;"
    },
    "ml": {
      concept: "Un modelo aprende patrones a partir de ejemplos. Se entrena con una parte de los datos y se evalúa con datos separados que no vio durante el ajuste.",
      example: "from sklearn.model_selection import train_test_split\nX_train, X_test, y_train, y_test = train_test_split(\n    X, y, test_size=0.2, random_state=42\n)",
      explain: "X contiene variables de entrada y y la respuesta que quieres predecir. El 20% queda reservado para evaluar; random_state hace reproducible la partición.",
      challenge: "Explica por qué evaluar el modelo con los mismos datos usados para entrenarlo puede dar una impresión demasiado optimista.",
      solution: "Porque el modelo ya utilizó esos ejemplos para ajustar sus parámetros. Evaluar con datos no vistos ayuda a estimar cómo generaliza a casos nuevos."
    }
  };
  document.querySelectorAll(".lesson").forEach(card => {
    const check = card.querySelector("[data-lesson]");
    const lesson = check && miniLessons[check.dataset.lesson];
    if (!lesson || card.querySelector(".mini-lesson")) return;
    const panel = document.createElement("details");
    panel.className = "mini-lesson";
    panel.innerHTML = '<summary>Ver mini-lección: concepto, ejemplo y reto</summary><div class="mini-lesson-content"><section><span class="mini-label">01 · COMPRENDE</span><p></p></section><section><span class="mini-label">02 · EJEMPLO EXPLICADO</span><pre><code></code></pre><p></p></section><section><span class="mini-label">03 · TU TURNO</span><p></p></section><details class="mini-answer"><summary>Ver una posible solución</summary><pre><code></code></pre><p>Intenta resolverlo primero sin mirar. Puede haber más de una solución correcta.</p></details></div>';
    const blocks = panel.querySelectorAll(".mini-lesson-content section");
    blocks[0].querySelector("p").textContent = lesson.concept;
    panel.querySelectorAll("pre code")[0].textContent = lesson.example;
    blocks[1].querySelector("p").textContent = lesson.explain;
    blocks[2].querySelector("p").textContent = lesson.challenge;
    panel.querySelectorAll("pre code")[1].textContent = lesson.solution;
    card.appendChild(panel);
  });


  // Laboratorios locales: Python mediante Pyodide y SQL mediante SQLite WebAssembly.
  const pythonStarter = 'calificaciones = [8, 9, 7, 10, 6]\npromedio = sum(calificaciones) / len(calificaciones)\nprint("Calificaciones:", calificaciones)\nprint("Promedio:", round(promedio, 2))';
  let pyodideInstance = null;
  function loadExternalScript(src, marker) {
    return new Promise((resolve, reject) => {
      if (window[marker]) return resolve(window[marker]);
      const existing = document.querySelector('script[data-loader="' + marker + '"]');
      if (existing) { existing.addEventListener("load", () => resolve(window[marker])); existing.addEventListener("error", reject); return; }
      const script = document.createElement("script"); script.src = src; script.async = true; script.dataset.loader = marker;
      script.onload = () => window[marker] ? resolve(window[marker]) : reject(new Error("El motor no quedó disponible."));
      script.onerror = () => reject(new Error("No se pudo descargar el motor. Revisa tu conexión y vuelve a intentar."));
      document.head.appendChild(script);
    });
  }
  document.getElementById("runPython")?.addEventListener("click", async () => {
    const button=document.getElementById("runPython"), output=document.getElementById("pythonOutput"), status=document.getElementById("pythonStatus");
    button.disabled=true;button.textContent="Cargando / ejecutando…";status.textContent="Preparando Python";
    try {
      if(!pyodideInstance){await loadExternalScript("https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js","loadPyodide");pyodideInstance=await window.loadPyodide();}
      let printed="";pyodideInstance.setStdout({batched:value=>{printed+=value+"\n";}});
      await pyodideInstance.runPythonAsync(document.getElementById("pythonCode").value);
      output.textContent=printed.trim()||"El programa terminó sin imprimir resultados.";status.textContent="Python listo";
    } catch(error){output.textContent="No se pudo ejecutar el programa: "+error.message;status.textContent="Revisa la conexión o el código";}
    finally{button.disabled=false;button.textContent="▶ Ejecutar Python";}
  });
  document.getElementById("resetPython")?.addEventListener("click",()=>{document.getElementById("pythonCode").value=pythonStarter;document.getElementById("pythonOutput").textContent="Ejemplo restaurado.";});

  const sqlStarter='SELECT ciudad, COUNT(*) AS operaciones, ROUND(AVG(importe), 2) AS promedio\nFROM ventas\nGROUP BY ciudad\nORDER BY promedio DESC;';
  let sqlDb=null;
  function renderSQLRows(columns,values){
    const wrap=document.createElement("div"),table=document.createElement("table"),head=document.createElement("tr");
    columns.forEach(name=>{const th=document.createElement("th");th.textContent=name;head.appendChild(th);});table.appendChild(head);
    values.forEach(row=>{const tr=document.createElement("tr");row.forEach(value=>{const td=document.createElement("td");td.textContent=value==null?"NULL":String(value);tr.appendChild(td);});table.appendChild(tr);});
    wrap.className="table-scroll";wrap.appendChild(table);return wrap;
  }
  document.getElementById("runSQL")?.addEventListener("click",async()=>{
    const button=document.getElementById("runSQL"),output=document.getElementById("sqlOutput"),status=document.getElementById("sqlStatus");button.disabled=true;button.textContent="Preparando SQLite…";
    try{
      if(!sqlDb){await loadExternalScript("https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.js","initSqlJs");const SQL=await window.initSqlJs({locateFile:file=>"https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/"+file});sqlDb=new SQL.Database();sqlDb.run("CREATE TABLE ventas (id INTEGER, ciudad TEXT, producto TEXT, importe REAL); INSERT INTO ventas VALUES (1,'CDMX','Libro',180),(2,'Puebla','Cuaderno',45),(3,'CDMX','Pluma',25),(4,'Oaxaca','Libro',180),(5,'Puebla','Mochila',420),(6,'CDMX','Mochila',420),(7,'Oaxaca','Cuaderno',45),(8,'Puebla','Pluma',25);");}
      const results=sqlDb.exec(document.getElementById("sqlCode").value);output.replaceChildren();
      if(!results.length)output.textContent="Consulta ejecutada. No devolvió filas (puede ser una operación de escritura).";else results.forEach(result=>output.appendChild(renderSQLRows(result.columns,result.values)));
      status.textContent="SQLite listo";
    }catch(error){output.textContent="Error SQL: "+error.message;status.textContent="Corrige la consulta";}
    finally{button.disabled=false;button.textContent="▶ Ejecutar SQL";}
  });
  document.getElementById("resetSQL")?.addEventListener("click",()=>{document.getElementById("sqlCode").value=sqlStarter;document.getElementById("sqlOutput").textContent="Consulta restaurada.";});

  // Importa CSV/Excel, calcula calidad y genera una visualización local.
  let wbRows=[],wbHeaders=[],wbName="";
  const wbFile=document.getElementById("workbenchFile"),wbColumn=document.getElementById("workbenchColumn");
  function parseCSVText(source){
    const rows=[];let row=[],cell="",quoted=false;
    for(let i=0;i<source.length;i++){const ch=source[i],next=source[i+1];if(ch==='"'&&quoted&&next==='"'){cell+='"';i++;}else if(ch==='"')quoted=!quoted;else if(ch===","&&!quoted){row.push(cell);cell="";}else if((ch==="\n"||ch==="\r")&&!quoted){if(ch==="\r"&&next==="\n")i++;row.push(cell);if(row.some(v=>v!==""))rows.push(row);row=[];cell="";}else cell+=ch;}
    row.push(cell);if(row.some(v=>v!==""))rows.push(row);return rows;
  }
  function profileWorkbench(){
    const total=wbRows.length*wbHeaders.length,missing=wbRows.reduce((n,row)=>n+wbHeaders.filter(h=>row[h]===""||row[h]==null).length,0),seen=new Set();let duplicates=0;
    wbRows.forEach(row=>{const key=JSON.stringify(wbHeaders.map(h=>row[h]));if(seen.has(key))duplicates++;else seen.add(key);});
    document.getElementById("fileMetrics").innerHTML=[["Registros",wbRows.length],["Columnas",wbHeaders.length],["Celdas vacías",missing],["Filas duplicadas",duplicates]].map(([label,value])=>'<div class="metric-tile"><span>'+label+'</span><strong>'+value+'</strong></div>').join("");
    document.getElementById("fileQuality").textContent="Calidad inicial: "+(total?100*(total-missing)/total:0).toFixed(1)+"% de celdas con valor. Se identificaron "+duplicates+" filas duplicadas exactas. Revisa antes de eliminarlas.";
    const table=document.createElement("table"),head=document.createElement("tr");wbHeaders.forEach(h=>{const th=document.createElement("th");th.textContent=h;head.appendChild(th);});table.appendChild(head);
    wbRows.slice(0,8).forEach(row=>{const tr=document.createElement("tr");wbHeaders.forEach(h=>{const td=document.createElement("td");td.textContent=String(row[h]??"");tr.appendChild(td);});table.appendChild(tr);});document.getElementById("filePreview").replaceChildren(table);
    wbColumn.replaceChildren(...wbHeaders.map(h=>{const o=document.createElement("option");o.value=h;o.textContent=h;return o;}));
    const numeric=wbHeaders.find(h=>wbRows.some(row=>row[h]!==""&&Number.isFinite(Number(row[h]))));if(numeric)wbColumn.value=numeric;
    wbColumn.disabled=false;document.getElementById("analyzeFile").disabled=!numeric;document.getElementById("downloadCleanCSV").disabled=false;
  }
  wbFile?.addEventListener("change",async()=>{
    const file=wbFile.files?.[0];if(!file)return;
    try{let matrix;if(/\.xlsx?$|\.xls$/i.test(file.name)){if(!window.XLSX)throw new Error("No se pudo cargar el lector de Excel. Comprueba tu conexión.");const book=XLSX.read(await file.arrayBuffer(),{type:"array"});matrix=XLSX.utils.sheet_to_json(book.Sheets[book.SheetNames[0]],{header:1,defval:""});}else matrix=parseCSVText(await file.text());
      if(!matrix.length)throw new Error("El archivo no contiene filas.");wbHeaders=matrix[0].map((v,i)=>String(v||"columna_"+(i+1)).trim());wbRows=matrix.slice(1).map(row=>Object.fromEntries(wbHeaders.map((h,i)=>[h,row[i]??""])));wbName=file.name;profileWorkbench();
    }catch(error){document.getElementById("fileQuality").textContent="No se pudo leer el archivo: "+error.message;}
  });
  function drawHistogram(canvas,values){
    if(!canvas||!values.length)return;const ctx=canvas.getContext("2d"),w=canvas.width,h=canvas.height,bins=Math.min(12,Math.max(4,Math.ceil(Math.sqrt(values.length)))),min=Math.min(...values),max=Math.max(...values),span=max-min||1,counts=Array(bins).fill(0);
    values.forEach(v=>counts[Math.min(bins-1,Math.floor((v-min)/span*bins))]++);ctx.clearRect(0,0,w,h);ctx.fillStyle="#a5b6ad";ctx.font="13px sans-serif";ctx.fillText("Frecuencia",12,18);
    const peak=Math.max(...counts,1),gap=5,plotW=w-45,plotH=h-55,barW=plotW/bins-gap;counts.forEach((n,i)=>{const bh=n/peak*plotH;ctx.fillStyle="#62c5a2";ctx.fillRect(32+i*(barW+gap),h-30-bh,barW,bh);ctx.fillStyle="#a5b6ad";ctx.fillText(String(n),32+i*(barW+gap),h-35-bh);});ctx.fillText(String(min),32,h-8);ctx.fillText(String(max),w-45,h-8);
  }
  document.getElementById("analyzeFile")?.addEventListener("click",()=>{
    const key=wbColumn.value,values=wbRows.map(row=>row[key]).filter(v=>v!==""&&v!=null&&Number.isFinite(Number(v))).map(Number);if(!values.length){document.getElementById("fileInterpretation").textContent="No se encontraron valores numéricos válidos.";return;}
    const sorted=[...values].sort((a,b)=>a-b),mean=values.reduce((a,b)=>a+b,0)/values.length,median=sorted.length%2?sorted[(sorted.length-1)/2]:(sorted[sorted.length/2-1]+sorted[sorted.length/2])/2,sd=Math.sqrt(values.reduce((s,v)=>s+(v-mean)**2,0)/values.length);
    document.getElementById("fileInterpretation").textContent=key+": "+values.length+" valores válidos · media "+mean.toFixed(2)+" · mediana "+median.toFixed(2)+" · desviación estándar poblacional "+sd.toFixed(2)+". La media puede verse afectada por valores extremos.";drawHistogram(document.getElementById("fileChart"),values);
  });
  document.getElementById("downloadCleanCSV")?.addEventListener("click",()=>{
    const unique=[],seen=new Set();wbRows.forEach(row=>{const key=JSON.stringify(wbHeaders.map(h=>row[h]));if(!seen.has(key)){seen.add(key);unique.push(row);}});
    const quote=v=>'"'+String(v??"").replace(/"/g,'""')+'"',csv=[wbHeaders.map(quote).join(","),...unique.map(row=>wbHeaders.map(h=>quote(row[h])).join(","))].join("\r\n"),url=URL.createObjectURL(new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"})),a=document.createElement("a");a.href=url;a.download=(wbName.replace(/\.[^.]+$/,"")||"datos")+"_sin_duplicados.csv";a.click();URL.revokeObjectURL(url);
  });

  // Visualizaciones matemáticas interactivas.
  document.getElementById("calculateVector")?.addEventListener("click",()=>{
    const parse=id=>document.getElementById(id).value.split(/[;,\s]+/).filter(Boolean).map(Number),a=parse("vectorA"),b=parse("vectorB"),out=document.getElementById("vectorResult");
    if(!a.length||a.length!==b.length||[...a,...b].some(v=>!Number.isFinite(v))){out.textContent="Ingresa dos vectores numéricos con la misma cantidad de componentes.";return;}
    out.textContent="Producto punto = "+a.map((v,i)=>v+"×"+b[i]).join(" + ")+" = "+a.reduce((sum,v,i)=>sum+v*b[i],0);
  });
  function drawDerivative(){
    const x=Number(document.getElementById("derivativeX").value),canvas=document.getElementById("derivativeChart");if(!canvas)return;
    document.getElementById("derivativeValue").textContent=x;document.getElementById("derivativeResult").textContent="En x = "+x+", f(x) = "+(x*x).toFixed(2)+" y la pendiente f'(x) = "+(2*x).toFixed(2)+".";
    const c=canvas.getContext("2d"),w=canvas.width,h=canvas.height;c.clearRect(0,0,w,h);c.strokeStyle="#40564b";c.beginPath();c.moveTo(15,h/2);c.lineTo(w-10,h/2);c.moveTo(w/2,8);c.lineTo(w/2,h-12);c.stroke();
    const X=v=>w/2+v*42,Y=v=>h/2-v*15;c.strokeStyle="#62c5a2";c.lineWidth=2;c.beginPath();for(let i=0;i<=100;i++){const v=-5+i*.1;i?c.lineTo(X(v),Y(v*v)):c.moveTo(X(v),Y(v*v));}c.stroke();
    c.strokeStyle="#e5bd73";c.beginPath();for(let i=0;i<=100;i++){const v=-5+i*.1,y=x*x+2*x*(v-x);i?c.lineTo(X(v),Y(y)):c.moveTo(X(v),Y(y));}c.stroke();c.fillStyle="#e5bd73";c.beginPath();c.arc(X(x),Y(x*x),5,0,Math.PI*2);c.fill();
  }
  document.getElementById("derivativeX")?.addEventListener("input",drawDerivative);drawDerivative();
  function runCoin(){
    const n=Number(document.getElementById("coinTrials").value);document.getElementById("coinTrialsValue").textContent=n;let heads=0;for(let i=0;i<n;i++)if(Math.random()<.5)heads++;
    const p=heads/n;document.getElementById("coinResult").textContent="Caras: "+heads+" de "+n+" · frecuencia relativa: "+(p*100).toFixed(1)+"% · probabilidad teórica: 50%. Cada simulación puede variar.";
    const canvas=document.getElementById("coinChart"),c=canvas.getContext("2d");c.clearRect(0,0,canvas.width,canvas.height);c.fillStyle="#62c5a2";c.fillRect(30,35,(canvas.width-60)*p,28);c.fillStyle="#e5bd73";c.fillRect(30+(canvas.width-60)*.5,25,2,48);c.fillStyle="#a5b6ad";c.fillText("0%",30,85);c.fillText("100%",canvas.width-65,85);c.fillText("50% teórico",canvas.width/2-28,18);
  }
  document.getElementById("coinTrials")?.addEventListener("input",()=>{document.getElementById("coinTrialsValue").textContent=document.getElementById("coinTrials").value;});document.getElementById("runCoin")?.addEventListener("click",runCoin);runCoin();

  // Panel académico agregado desde los registros locales de la plataforma.
  const goalInput=document.getElementById("weeklyGoal"),GOAL_KEY="datos-cero-weekly-goal-v1";try{goalInput.value=localStorage.getItem(GOAL_KEY)||"300";}catch(e){}
  function renderStudentDashboard(){
    const lessons=document.querySelectorAll("[data-lesson]:checked").length,lessonTotal=document.querySelectorAll("[data-lesson]").length,projects=document.querySelectorAll("[data-project-task]:checked").length,projectTotal=document.querySelectorAll("[data-project-task]").length;
    let sessions=[];try{sessions=JSON.parse(localStorage.getItem("datos-desde-cero-study-plan-v1")||"[]");}catch(e){}if(!Array.isArray(sessions))sessions=[];
    const minutes=sessions.filter(s=>s&&s.done).reduce((sum,s)=>sum+(Number(s.minutes)||0),0),goal=Number(goalInput?.value)||300,percent=Math.min(100,Math.round(minutes/goal*100));
    document.getElementById("dashLessons").textContent=lessons+" / "+lessonTotal;document.getElementById("dashProjects").textContent=(projectTotal?Math.round(projects/projectTotal*100):0)+"%";document.getElementById("dashMinutes").textContent=minutes;document.getElementById("dashGoal").textContent=percent+"%";document.getElementById("dashGoalText").textContent=minutes+" de "+goal+" minutos completados";
  }
  document.getElementById("saveWeeklyGoal")?.addEventListener("click",()=>{const value=Math.max(30,Math.min(3000,Number(goalInput.value)||300));goalInput.value=value;try{localStorage.setItem(GOAL_KEY,String(value));}catch(e){}renderStudentDashboard();});
  renderStudentDashboard();document.querySelectorAll("[data-lesson],[data-project-task]").forEach(el=>el.addEventListener("change",renderStudentDashboard));
  document.getElementById("studySessions")?.addEventListener("change",renderStudentDashboard);

})();
