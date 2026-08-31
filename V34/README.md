# Novatrix kundtjänst dokumentation

**Nima Kamali**

**Azure V34**

**Repo**    
https://github.com/nima1233/azure-MOV25/tree/main/V34

## Delmoment 2
### Skapa resursgrupp i Azure.

Prenumeration: Azure subscription 1     
Namn på resursgrupp: rg-novatrix-v34        
Region: Sweden Central      

### Skapa Virtuell Maskin i Azure
**(Inställningar som inte nämns är default)**   
Prenumeration: Azure subscription 1     
Resursgrupp: rg-novatrix-v34    
Namn på virtuell dator: vm-novatrix-web-ip  
Region: Sweden Central  
Image: Ubuntu Server 24.04 LTS - x64 Gen2   
Storlek: Standard B2ats_v2  
Namn på nyckelpar: vm-novatrix-web_key  
Välj inkommande portar: SSH (20) är redan förvald, lägg till HTTP (80)  

Granska och skapa
Skapa
Hämta privat nyckel och skapa resurs
Sparar den i ```C:\VM\Azure```
### VM nu skapad
![delmoment 2](delmoment2.png)
## Delmoment 3

Öppna terminalen på fysiska datorn
Navigera till mappen SSH nyckel är i
```
cd C:\VM\Azure
```

Sätta behörighet på SSH nyckeln

```
icacls .\vm-novatrix-web_key.pem /inheritance:r
```

```
icacls .\vm-novatrix-web_key.pem /grant:r "$($env:USERNAME):R"
```

Anslut till VM i Azure (ip adressen hittas under "publik ip adress" i Azure för VMen)

```
ssh -i .\vm-novatrix-web_key.pem azureuser@135.116.65.38
```
Godkänn med ```yes```
### Ansluten till VM
![terminal ansluten vm](delmoment3ssh.png)

Uppdatera severn med det senaste
Lista alla tillgängliga uppdateringar

```
sudo apt update
```

Ladda ner alla tillgängliga uppdateringar

```
sudo apt upgrade -y
```

När de senaste uppdateringarna är installerade ska NGINX installeras på servern

```
sudo apt install nginx -y
```

När den är installerad dubbelkollar vi ifall den är igång

```
systemctl status nginx
```

### nginx är running ('q' för att komma ur status vyn)
![nginx status](delmoment3nginx.png)

## Delmoment 4
Navigera till nginx välkomstsida i terminalen

```
cd /var/www/html/
```

Öppna html filen i terminalen

```
sudo nano index.html 
```

Formuläret
```
<!DOCTYPE html>
<html>
<head>
<title>Welcome to Novatrix</title>
<style>
html { color-scheme: light dark; }
body { width: 35em; margin: 0 auto;
font-family: Tahoma, Verdana, Arial, sans-serif; }
</style>
</head>
<body>
<h1>Novatrix Kundtjanst</h1>
<p>Kontakta var kundtjanst</p>

<form>
<label for='name'>Namn</label>
<input type='text' id='name' name='name'><br/>
<label for='mail'>Mail</label>
<input type='text' id='mail' name='mail'><br/>
<label for='msg'>Meddelande</label>
<textarea id='msg' name='msg' rows='4' cols='50'></textarea><br/>
<input type='submit' value='Skicka'>
</form>

</body>
</html>
```

Spara och stäng editorn

```
CTRL + O, ENTER, CTRL X
```

### Nu går det att se innehållet på sidan genom att gå in på ```135.116.65.38```
![sidan fungerar](delmoment4ip.png)