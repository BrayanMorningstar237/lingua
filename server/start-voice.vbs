' Langwa natural voice: double-click to start. No black window: the voice runs in the background
' and a progress page opens in the browser (progress also shows under the Langwa button).
' First time: downloads about 700 MB once, into this Langwa folder. Next times: ready in ~20 s.
' Messages are short, in English and French. Details of any problem: server\models\voice.log
Option Explicit
Dim sh, fs, here, root, models, logFile, startup, quiet, code, answer, link
Set sh = CreateObject("WScript.Shell")
Set fs = CreateObject("Scripting.FileSystemObject")
here = fs.GetParentFolderName(WScript.ScriptFullName)
root = fs.GetParentFolderName(here)
models = here & "\models"
logFile = models & "\voice.log"
startup = sh.SpecialFolders("Startup") & "\Langwa voice.vbs"
quiet = (WScript.Arguments.Count > 0)
If quiet Then quiet = (LCase(WScript.Arguments(0)) = "/quiet")

Function Running()
  Dim x
  Running = False
  On Error Resume Next
  Set x = CreateObject("MSXML2.ServerXMLHTTP.6.0")
  x.setTimeouts 1500, 1500, 1500, 1500
  x.open "GET", "http://127.0.0.1:8770/health", False
  x.send
  If Err.Number = 0 Then Running = (x.status = 200)
  On Error GoTo 0
End Function

Sub ShowProgress()
  ' The progress page reads the voice's live status (step, MB, time left) and says when it is ready.
  On Error Resume Next
  sh.Run """" & here & "\progress.html""", 1, False
  On Error GoTo 0
End Sub

If Running() Then
  If Not quiet Then ShowProgress
  WScript.Quit 0
End If

If Not fs.FolderExists(models) Then fs.CreateFolder models

' Once: offer to start the voice with the computer (it sleeps when unused, so it costs little).
If Not quiet And Not fs.FileExists(models & "\.autostart-asked") Then
  fs.CreateTextFile(models & "\.autostart-asked", True).Close
  answer = MsgBox("Start the Langwa voice by itself when this computer starts?" & vbCrLf & _
    "It sleeps when unused. To undo: Win+R, shell:startup, delete ""Langwa voice""." & vbCrLf & vbCrLf & _
    "Demarrer la voix Langwa avec l'ordinateur ?", vbYesNo + vbQuestion, "Langwa voice")
  If answer = vbYes Then
    Set link = fs.CreateTextFile(startup, True)
    link.WriteLine "CreateObject(""WScript.Shell"").Run ""wscript.exe """"" & WScript.ScriptFullName & """"" /quiet"", 0, False"
    link.Close
  End If
End If

If Not quiet Then ShowProgress

' Run the voice hidden and wait: it keeps running until the computer stops (it sleeps when unused).
code = sh.Run("cmd.exe /d /c """"" & here & "\start-voice.cmd"" --hidden > """ & logFile & """ 2>&1""", 0, True)
If code <> 0 And code <> 3 And Not quiet Then
  MsgBox "The Langwa voice could not start. This is usually the internet connection." & vbCrLf & _
    "Double-click ""Start Langwa voice"" again: it continues where it stopped." & vbCrLf & _
    "Details: " & logFile & vbCrLf & vbCrLf & _
    "La voix Langwa n'a pas pu demarrer, souvent a cause de la connexion. Relancez : elle reprend ou elle s'est arretee.", vbExclamation, "Langwa voice"
End If
