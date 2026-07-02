// CSV-export (Excel-compatibel: puntkomma-gescheiden, UTF-8 met BOM)
function csvDownload(bestandsnaam, kolommen, rijen) {
  const cel = v => {
    v = String(v ?? '').replace(/\r?\n/g, ' ');
    return /[";,]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  };
  const regels = [kolommen.map(cel).join(';'), ...rijen.map(r => r.map(cel).join(';'))];
  const blob = new Blob(['\uFEFF' + regels.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = bestandsnaam;
  a.click();
  URL.revokeObjectURL(a.href);
}
