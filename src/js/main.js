// Init
updateDataStatus();
loadFromURL();
buildChips();
updateAllToggleBtns();
initDpVis();
renderClusterSidebar();
renderHloSidebar();
renderProgressBars();
applyFilters();
try { if(localStorage.getItem('sbCollapsed_v3')==='1') toggleSidebar(); } catch(e){}
startTourAlsNieuw();
