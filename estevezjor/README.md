# Intermediario para publicar

Servicio mínimo en Cloudflare Workers que recibe el Excel desde el tablero, verifica
la contraseña del equipo y sube el archivo a `datos/` en GitHub. Existe porque una
página pública no puede llevar dentro la credencial de GitHub.

## Despliegue

```
wrangler login
wrangler deploy
wrangler secret put CLAVE_EQUIPO   # la contraseña que se reparte al equipo
wrangler secret put GH_TOKEN       # token de GitHub, permiso Contents write en este repo
```

Para cambiar la contraseña, se vuelve a correr `wrangler secret put CLAVE_EQUIPO`.
Para revocar el acceso por completo, se borra el token en GitHub.
