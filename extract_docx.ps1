Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead('C:\SIMIDS\discovery-systems-pos\historial chat.docx')
$entry = $zip.GetEntry('word/document.xml')
$reader = New-Object System.IO.StreamReader($entry.Open())
$xmlString = $reader.ReadToEnd()
$reader.Close()
$zip.Dispose()

$xml = [xml]$xmlString
$nsMgr = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
$nsMgr.AddNamespace('w', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main')

$paragraphs = $xml.SelectNodes('//w:p', $nsMgr)

$content = @()
foreach ($p in $paragraphs) {
    $textNodes = $p.SelectNodes('.//w:t', $nsMgr)
    $pText = ""
    foreach ($t in $textNodes) {
        $pText += $t.InnerText
    }
    if ($pText.Trim() -ne "") {
        $content += $pText
    }
}

$content -join "`r`n"
