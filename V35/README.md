# Novatrix IAM och identitet dokumentation

**Nima Kamali**

**Azure V35**

**Repo**    
https://github.com/nima1233/azure-MOV25/tree/main/V35

## Delmoment 2
### Skapa identiteter

La till Anna (Drift) och Erik (Utveckling) som användare    
![delmoment2anv](delmoment2anv.png)

La till Drift och Utveckling säkerhetsgrupp, och la in Anna och Erik i respektive
![delmoment2grp](delmoment2grp.png)

## Delmoment 3
### Tilldela behörigheter (RBAC)

Två role assignments. Azure-Drift får contributor rollen för de sköter maskinerna. Azure-Utveckling får reader för de ska endast kunna läsa av och de behöver inte kunna skapa eller modifiera maskinerna. Scopen för dessa roller är på resursgruppen.

![delmoment3](delmoment3.png)

## Delmoment 4
### Skapa managed identity

Skapade en managed identity som kopplades till min resursgrupp.

![delmoment4](delmoment4.png)