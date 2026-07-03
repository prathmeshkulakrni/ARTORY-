Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Stop"

$publicDir = Join-Path $PSScriptRoot "..\public"
$assetDir = Join-Path $publicDir "assets"
$cursorDir = Join-Path $assetDir "cursors"
New-Item -ItemType Directory -Force -Path $cursorDir | Out-Null

function New-Canvas($w, $h) {
  $bmp = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  return @($bmp, $g)
}

function Save-Png($bmp, $path) {
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
}

function PF($x, $y) {
  return [System.Drawing.PointF]::new([float]$x, [float]$y)
}

function PI($x, $y) {
  return [System.Drawing.Point]::new([int]$x, [int]$y)
}

function Draw-CenteredText($g, $text, $font, $brush, $y) {
  $size = $g.MeasureString($text, $font)
  $g.DrawString($text, $font, $brush, [float]((1024 - $size.Width) / 2), [float]$y)
}

function Write-CurFromPng($pngPath, $curPath, $hotX, $hotY) {
  [byte[]]$png = [System.IO.File]::ReadAllBytes($pngPath)
  $fs = [System.IO.File]::Open($curPath, [System.IO.FileMode]::Create)
  $bw = New-Object System.IO.BinaryWriter($fs)
  try {
    $bw.Write([UInt16]0)
    $bw.Write([UInt16]2)
    $bw.Write([UInt16]1)
    $bw.Write([byte]64)
    $bw.Write([byte]64)
    $bw.Write([byte]0)
    $bw.Write([byte]0)
    $bw.Write([UInt16]$hotX)
    $bw.Write([UInt16]$hotY)
    $bw.Write([UInt32]$png.Length)
    $bw.Write([UInt32]22)
    $bw.Write($png)
  } finally {
    $bw.Close()
    $fs.Close()
  }
}

function Draw-Brush($g, $scale, $dx, $dy, $state, $frame) {
  $s = $scale
  $shadowAlpha = 96
  if ($state -eq "hover") { $shadowAlpha = 132 }
  if ($state -eq "pressed") { $shadowAlpha = 112 }
  $shadow = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb($shadowAlpha, 0, 0, 0))
  $g.TranslateTransform($dx, $dy)

  if ($state -eq "loading") {
    $ringPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(180, 236, 72, 153), 3.0)
    $ringPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $ringPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $start = ($frame * 45) % 360
    $g.DrawArc($ringPen, 4 * $s, 4 * $s, 50 * $s, 50 * $s, $start, 245)
    $ringPen.Dispose()
  }

  $glowColor = if ($state -eq "hover") { [System.Drawing.Color]::FromArgb(90, 124, 58, 237) } elseif ($state -eq "pressed") { [System.Drawing.Color]::FromArgb(80, 236, 72, 153) } else { [System.Drawing.Color]::FromArgb(54, 124, 58, 237) }
  $glowPen = [System.Drawing.Pen]::new($glowColor, [float](7.0 * $s))
  $glowPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $glowPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $g.DrawLine($glowPen, 18 * $s, 46 * $s, 55 * $s, 9 * $s)
  $glowPen.Dispose()

  $g.FillEllipse($shadow, 5 * $s, 54 * $s, 22 * $s, 6 * $s)

  $handlePath = New-Object System.Drawing.Drawing2D.GraphicsPath
  $handlePath.AddLine([float](20 * $s), [float](44 * $s), [float](48 * $s), [float](16 * $s))
  $handlePath.AddBezier(48 * $s, 16 * $s, 54 * $s, 9 * $s, 59 * $s, 8 * $s, 61 * $s, 10 * $s)
  $handlePath.AddLine([float](61 * $s), [float](10 * $s), [float](55 * $s), [float](23 * $s))
  $handlePath.AddLine([float](55 * $s), [float](23 * $s), [float](27 * $s), [float](51 * $s))
  $handlePath.CloseFigure()
  $handleBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (PF (20 * $s) (44 * $s)),
    (PF (59 * $s) (10 * $s)),
    [System.Drawing.Color]::FromArgb(255, 31, 82, 255),
    [System.Drawing.Color]::FromArgb(255, 15, 32, 170)
  )
  $g.FillPath($handleBrush, $handlePath)
  $shinePen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(120, 190, 210, 255), [float](2.2 * $s))
  $shinePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $shinePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $g.DrawLine($shinePen, 25 * $s, 42 * $s, 55 * $s, 12 * $s)
  $shinePen.Dispose()

  $ferrule = New-Object System.Drawing.Drawing2D.GraphicsPath
  $ferrule.AddPolygon([System.Drawing.PointF[]]@(
    (PF (14 * $s) (42 * $s)),
    (PF (21 * $s) (35 * $s)),
    (PF (31 * $s) (45 * $s)),
    (PF (24 * $s) (52 * $s))
  ))
  $metal = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (PF (15 * $s) (39 * $s)),
    (PF (29 * $s) (51 * $s)),
    [System.Drawing.Color]::FromArgb(255, 247, 229, 182),
    [System.Drawing.Color]::FromArgb(255, 43, 28, 25)
  )
  $g.FillPath($metal, $ferrule)
  $ferrulePen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(180, 255, 255, 255), [float](1.2 * $s))
  $g.DrawPath($ferrulePen, $ferrule)
  $ferrulePen.Dispose()

  $bristle = New-Object System.Drawing.Drawing2D.GraphicsPath
  $bristle.AddBezier(5 * $s, 58 * $s, 8 * $s, 47 * $s, 11 * $s, 40 * $s, 18 * $s, 38 * $s)
  $bristle.AddLine([float](18 * $s), [float](38 * $s), [float](24 * $s), [float](50 * $s))
  $bristle.AddLine([float](24 * $s), [float](50 * $s), [float](5 * $s), [float](58 * $s))
  $bristle.CloseFigure()
  $bristleBrush = New-Object System.Drawing.Drawing2D.PathGradientBrush($bristle)
  $bristleBrush.CenterColor = [System.Drawing.Color]::FromArgb(255, 95, 18, 12)
  $bristleBrush.SurroundColors = [System.Drawing.Color[]]@([System.Drawing.Color]::FromArgb(255, 255, 115, 0))
  $g.FillPath($bristleBrush, $bristle)
  $tip = New-Object System.Drawing.Drawing2D.GraphicsPath
  $tip.AddBezier(3.5 * $s, 59 * $s, 6 * $s, 51 * $s, 10 * $s, 47 * $s, 15 * $s, 43 * $s)
  $tip.AddLine([float](15 * $s), [float](43 * $s), [float](3.5 * $s), [float](59 * $s))
  $tip.CloseFigure()
  $tipBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (PF (3 * $s) (59 * $s)),
    (PF (17 * $s) (42 * $s)),
    [System.Drawing.Color]::FromArgb(255, 255, 64, 0),
    [System.Drawing.Color]::FromArgb(255, 255, 177, 24)
  )
  $g.FillPath($tipBrush, $tip)
  $hairPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(120, 70, 16, 10), [float](1.0 * $s))
  $hairPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $hairPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $g.DrawBezier($hairPen, 8 * $s, 56 * $s, 12 * $s, 49 * $s, 16 * $s, 43 * $s, 21 * $s, 40 * $s)
  $g.DrawBezier($hairPen, 12 * $s, 55 * $s, 16 * $s, 50 * $s, 18 * $s, 46 * $s, 22 * $s, 41 * $s)
  $hairPen.Dispose()

  if ($state -eq "pressed") {
    $pressPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(210, 255, 123, 39), [float](2.0 * $s))
    $pressPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pressPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawLine($pressPen, 2 * $s, 61 * $s, 13 * $s, 57 * $s)
    $pressPen.Dispose()
  }

  $handlePath.Dispose()
  $handleBrush.Dispose()
  $ferrule.Dispose()
  $metal.Dispose()
  $bristle.Dispose()
  $bristleBrush.Dispose()
  $tip.Dispose()
  $tipBrush.Dispose()
  $shadow.Dispose()
  $g.ResetTransform()
}

function Export-CursorState($name, $state, $frame) {
  $canvas = New-Canvas 64 64
  $bmp = $canvas[0]
  $g = $canvas[1]
  Draw-Brush $g 1 0 0 $state $frame
  $pngPath = Join-Path $cursorDir "$name.png"
  $curPath = Join-Path $cursorDir "$name.cur"
  Save-Png $bmp $pngPath
  Write-CurFromPng $pngPath $curPath 4 59
  $g.Dispose()
  $bmp.Dispose()
}

Export-CursorState "brush-normal" "normal" 0
Export-CursorState "brush-hover" "hover" 0
Export-CursorState "brush-pressed" "pressed" 0
Export-CursorState "brush-loading" "loading" 0
for ($i = 0; $i -lt 8; $i++) {
  $canvas = New-Canvas 64 64
  Draw-Brush $canvas[1] 1 0 0 "loading" $i
  Save-Png $canvas[0] (Join-Path $cursorDir ("brush-loading-{0}.png" -f $i))
  $canvas[1].Dispose()
  $canvas[0].Dispose()
}

$logoCanvas = New-Canvas 1024 1024
$logo = $logoCanvas[0]
$lg = $logoCanvas[1]
$cream = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 252, 244))
$lg.FillEllipse($cream, 0, 0, 1024, 1024)
$lg.SetClip([System.Drawing.Rectangle]::new(0, 0, 1024, 1024))
$titleFont = New-Object System.Drawing.Font("Georgia", 104, [System.Drawing.FontStyle]::Bold)
$subFont = New-Object System.Drawing.Font("Arial", 32, [System.Drawing.FontStyle]::Bold)
$navy = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 8, 31, 68))
$orange = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 245, 101, 36))
$teal = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 36, 136, 159))
$purple = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 111, 61, 151))
$aFont = New-Object System.Drawing.Font("Georgia", 520, [System.Drawing.FontStyle]::Bold)
$aBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  (PI 300 80),
  (PI 740 690),
  [System.Drawing.Color]::FromArgb(255, 255, 149, 31),
  [System.Drawing.Color]::FromArgb(255, 213, 31, 116)
)
$lg.DrawString("A", $aFont, $aBrush, 310, 34)
Draw-Brush $lg 5.5 270 80 "normal" 0
Draw-CenteredText $lg "ARTORY" $titleFont $navy 690
Draw-CenteredText $lg "CREATE. LEARN. INSPIRE." $subFont $orange 820
Draw-CenteredText $lg "AI  COMMUNITY  MARKETPLACE" $subFont $teal 880
Save-Png $logo (Join-Path $assetDir "artory-logo.png")
$lg.Dispose()
$logo.Dispose()
