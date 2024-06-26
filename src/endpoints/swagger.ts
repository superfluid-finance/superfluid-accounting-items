export const handler = async () => ({
	statusCode: 200,
	headers: {
		'Access-Control-Allow-Origin': '*',
	},
	body: `
    <!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <meta name="description" content="Superfluid Accounting API swagger documentation" />
            <title>Superfluid Accounting API</title>
            <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.17.4/swagger-ui.css" />
        </head>
        <body>
            <div id="swagger-ui"></div>
            <script src="https://unpkg.com/swagger-ui-dist@5.17.4/swagger-ui-bundle.js" crossorigin></script>
            <script>
                window.onload = () => {
                    window.ui = SwaggerUIBundle({
                        url: '/static/api-docs.yaml',
                        dom_id: '#swagger-ui',
                    });
                };
            </script>
        </body>
    </html>`,
});
