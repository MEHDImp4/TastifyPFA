from django.http import JsonResponse

# Cette fonction est une "Vue" (View) très simple
# Elle sert uniquement à vérifier que le serveur backend répond bien
def health(request):
    # On renvoie une réponse au format JSON, facile à lire pour le frontend ou un outil de monitoring
    return JsonResponse({
        'status': 'ok', 
        'service': 'tastify-backend'
    })
