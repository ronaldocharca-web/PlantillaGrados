Option Explicit
Dim word, doc, target, find, changed
target = LCase(WScript.Arguments(0))
On Error Resume Next
Set word = GetObject(, "Word.Application")
If Err.Number <> 0 Then
  WScript.Echo "No se pudo conectar con Word."
  WScript.Quit 2
End If
On Error GoTo 0
For Each doc In word.Documents
  WScript.Echo "Abierto: " & doc.FullName
  If LCase(doc.FullName) = target Then
    WScript.Echo "Documento abierto: " & doc.FullName
    If Not doc.Saved Then
      WScript.Echo "El documento tiene cambios sin guardar; no se modificó."
      WScript.Quit 3
    End If
    Set find = doc.Content.Find
    find.ClearFormatting
    find.Replacement.ClearFormatting
    find.Text = "{{articulo}} {{articulo}}"
    find.Replacement.Text = "{{articulo}}"
    find.Forward = True
    find.Wrap = 0
    find.Format = False
    find.Replacement.Format = False
    changed = find.Execute(, False, False, False, False, False, True, 0, False, "{{articulo}}", 2)
    If changed Then
      doc.Save
      WScript.Echo "Repetición corregida y documento guardado."
    Else
      WScript.Echo "No se encontró la repetición en Word."
    End If
    WScript.Quit 0
  End If
Next
WScript.Echo "El documento no está abierto."
WScript.Quit 4
