# Automation och integration

**Nima Kamali**

**Repo**
https://github.com/nima1233/azure-MOV25/tree/main/V39

## Hela flödet

![helaflödet](flodet.png)

Formuläret sparar inte i en mapp utan två separate filer, en med bilaga, och den andra som JSON för texten. När det kommer in något i blob storage triggrar den igång flödet.       

På vänstra sidan är det JSON delen. Get blob content (V2) hämtar all information som sparas som JSON i arenden.       
     
I Create Item för SharePoint, Post message in a chat or channel för Teams, och Send en email (V2) används dessa för att ta ut de information vi vill ha från Get blob content 
````@{json(body('Get_blob_content_(V2)'))?['name']}````= Namn från formuläret     
````@{json(body('Get_blob_content_(V2)'))?['mail']}```` = Mail från formuläret     
````@{json(body('Get_blob_content_(V2)'))?['message']}```` = Meddelandet från formuläret      
