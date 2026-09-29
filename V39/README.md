# Automation och integration

**Nima Kamali**

**Repo**
https://github.com/nima1233/azure-MOV25/tree/main/V39

## Hela flödet

![helaflödet](flodet.png)

Formuläret sparar inte i en mapp utan två separate filer, en med bilaga, och den andra som JSON för texten. När det kommer in något i blob storage triggrar den igång flödet.       

På vänstra sidan är det JSON delen. Get blob content (V2) hämtar all information som sparas som JSON i arenden.       
     
I Create Item för SharePoint, Post message in a chat or channel för Teams, och Send en email (V2) används dessa för att ta ut de information vi vill ha från Get blob content       
````
@{json(body('Get_blob_content_(V2)'))?['name']}
````
````
@{json(body('Get_blob_content_(V2)'))?['mail']}
````
````
@{json(body('Get_blob_content_(V2)'))?['message']}
````


På högra sidan är det bild delen. Lists blods (V2) kollar igenom containern arenden. Filter array listar allt som finns i arende containern och filtrerar med detta     

````
@startsWith(@{item()?['Name']},@{replace(
    replace(
      triggerBody()?['Name'],
      'arende-',
      ''
    ),
    '.json',
    ''
  )})
````
Exempel på hur JSON filerna sparas i blob container:        
````arende-20260929T140045Z-be2318d2.json````       
Exempel på bild som skickades i samma ärende:       
````20260929T140045Z-be2318d2-Untitled.png````

Filter array tar den JSON fil som triggrar flödet, tar bort "arende-" och ".json" sen kontrollerar ifall bilden ````20260929T140045Z-be2318d2-Untitled.png```` startar med 20260929T140045Z-be2318d2 vilket den gör och det blir vår output.        

Get blob content (V2) 1 som kommer efter filter array använder ````first(body('Filter_array'))?['Id']```` vilket tar den första matchningen och ger oss den bild som tillhör JSON filen. I send an email (V2) används Get blob content (V2) 1 för att attacha bilden med mailet.    

Initialize variable denna behövs för att kunna skicka bilden till Teams kanalen. Skapade SAS token för arende containern och använde den här. Value här är:     
````