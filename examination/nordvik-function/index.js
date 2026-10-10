const { app } = require('@azure/functions');
const { DefaultAzureCredential } = require('@azure/identity');
const { BlobServiceClient } = require('@azure/storage-blob');
const { randomUUID } = require('crypto');

const storageAccountName = 'sttest841568n';
const containerName = 'felanmalan';

function getUserInfo(request) {
    const userId = request.headers.get('x-ms-client-principal-id');
    const principalHeader = request.headers.get('x-ms-client-principal');

    if (!userId || !principalHeader) {
        return null;
    }

    try {
        const principal = JSON.parse(
            Buffer.from(principalHeader, 'base64').toString('utf8')
        );

        return {
            userId: userId,
            roles: principal.claims
                .filter(claim => claim.typ === 'roles')
                .map(claim => claim.val)
        };

    } catch (error) {
        return null;
    }
}

const credential = new DefaultAzureCredential();

app.http('report', {
    methods: ['POST'],
    authLevel: 'anonymous',

    handler: async (request, context) => {
    try {
        const formData = await request.formData();
        const principalHeader = request.headers.get('x-ms-client-principal');
        const userId = request.headers.get('x-ms-client-principal-id');

        if (!userId || !principalHeader) {
            return {
                status: 401,
                jsonBody: {
                    success: false,
                    error: 'User is not authenticated'
                }
            };
        }

        let principal;

        try {
            principal = JSON.parse(
                Buffer.from(principalHeader, 'base64').toString('utf8')
            );
        } catch {
            return {
                status: 401,
                jsonBody: {
                    success: false,
                    error: 'Invalid user information'
                }
            };
        }

        const roles = principal.claims
            .filter(claim => claim.typ === 'roles')
            .map(claim => claim.val);

        if (!roles.includes('Tenant') && !roles.includes('Manager')) {
            return {
                status: 403,
                jsonBody: {
                    success: false,
                    error: 'Du har inte behörighet'
                }
            };
        }
        
            const title = formData.get('title');
            const description = formData.get('description');
            const category = formData.get('category');
            const image = formData.get('image');

            // Check required fields
            if (!title || !description || !category) {
                return {
                    status: 400,
                    jsonBody: {
                        success: false,
                        error: 'title, description and category are required'
                    }
                };
            }

            // Check that an image was provided
            if (!image || typeof image.arrayBuffer !== 'function') {
                return {
                    status: 400,
                    jsonBody: {
                        success: false,
                        error: 'image is required'
                    }
                };
            }

            // Generate one unique ID for the entire report
            const reportId = randomUUID();

            const blobServiceClient = new BlobServiceClient(
                `https://${storageAccountName}.blob.core.windows.net`,
                credential
            );

            const containerClient =
                blobServiceClient.getContainerClient(containerName);

            // -------------------------
            // Save JSON report
            // -------------------------

            const report = {
                id: reportId,
                userId: userId,
                title: title,
                description: description,
                category: category,
                imageName: image.name,
                createdAt: new Date().toISOString()
            };

            const jsonBlobName = `report-${reportId}.json`;

            const jsonBlobClient =
                containerClient.getBlockBlobClient(jsonBlobName);

            const jsonData = JSON.stringify(report);

            await jsonBlobClient.upload(
                jsonData,
                Buffer.byteLength(jsonData),
                {
                    blobHTTPHeaders: {
                        blobContentType: 'application/json'
                    },
                    conditions: {
                        ifNoneMatch: '*'
                    }
                }
            );

            // -------------------------
            // Save image
            // -------------------------

            const originalName = image.name || 'image';
            const extension = originalName.includes('.')
                ? originalName.substring(originalName.lastIndexOf('.'))
                : '';

            const imageBlobName = `report-${reportId}${extension}`;

            const imageBlobClient =
                containerClient.getBlockBlobClient(imageBlobName);

            const imageBuffer = Buffer.from(
                await image.arrayBuffer()
            );

            await imageBlobClient.upload(
                imageBuffer,
                imageBuffer.length,
                {
                    blobHTTPHeaders: {
                        blobContentType: image.type || 'application/octet-stream'
                    },
                    conditions: {
                        ifNoneMatch: '*'
                    }
                }
            );

            return {
                status: 201,
                jsonBody: {
                    success: true,
                    reportId: reportId,
                    jsonBlob: jsonBlobName,
                    imageBlob: imageBlobName
                }
            };

        } catch (error) {
            context.error(error);

            return {
                status: 500,
                jsonBody: {
                    success: false,
                    error: error.message
                }
            };
        }
    }
});

app.http('reports', {
    methods: ['GET'],
    authLevel: 'anonymous',

    handler: async (request, context) => {
        try {
            const user = getUserInfo(request);

            if (!user) {
                return {
                    status: 401,
                    jsonBody: {
                        success: false,
                        error: 'User is not authenticated'
                    }
                };
            }

            const isTenant = user.roles.includes('Tenant');
            const isManager = user.roles.includes('Manager');
            const isFinance = user.roles.includes('Finance');

            if (!isTenant && !isManager && !isFinance) {
                return {
                    status: 403,
                    jsonBody: {
                        success: false,
                        error: 'User does not have a valid role'
                    }
                };
            }

            const blobServiceClient = new BlobServiceClient(
                `https://${storageAccountName}.blob.core.windows.net`,
                credential
            );

            const containerClient =
                blobServiceClient.getContainerClient(containerName);

            const reports = [];

            for await (const blob of containerClient.listBlobsFlat()) {

                if (!blob.name.endsWith('.json')) {
                    continue;
                }

                const blobClient =
                    containerClient.getBlobClient(blob.name);

                const download =
                    await blobClient.downloadToBuffer();

                const report =
                    JSON.parse(download.toString());

                // Tenant can only see their own reports
                if (isTenant && report.userId !== user.userId) {
                    continue;
                }

                reports.push(report);
            }

            return {
                status: 200,
                jsonBody: {
                    success: true,
                    reports: reports
                }
            };

        } catch (error) {
            context.error(error);

            return {
                status: 500,
                jsonBody: {
                    success: false,
                    error: error.message
                }
            };
        }
    }
});

app.http('report-image', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'report/{id}/image',

    handler: async (request, context) => {
        try {
            const user = getUserInfo(request);

            if (!user) {
                return {
                    status: 401,
                    jsonBody: {
                        success: false,
                        error: 'User is not authenticated'
                    }
                };
            }

            const isTenant = user.roles.includes('Tenant');
            const isManager = user.roles.includes('Manager');
            const isFinance = user.roles.includes('Finance');

            if (!isTenant && !isManager && !isFinance) {
                return {
                    status: 403,
                    jsonBody: {
                        success: false,
                        error: 'User does not have a valid role'
                    }
                };
            }

            const reportId = request.params.id;

            const blobServiceClient = new BlobServiceClient(
                `https://${storageAccountName}.blob.core.windows.net`,
                credential
            );

            const containerClient =
                blobServiceClient.getContainerClient(containerName);

            // Find the report JSON
            const jsonBlobName = `report-${reportId}.json`;

            const jsonBlobClient =
                containerClient.getBlobClient(jsonBlobName);

            if (!(await jsonBlobClient.exists())) {
                return {
                    status: 404,
                    jsonBody: {
                        success: false,
                        error: 'Report not found'
                    }
                };
            }

            const reportData =
                await jsonBlobClient.downloadToBuffer();

            const report =
                JSON.parse(reportData.toString());

            // Tenant can only access their own image
            if (isTenant && report.userId !== user.userId) {
                return {
                    status: 403,
                    jsonBody: {
                        success: false,
                        error: 'You are not allowed to access this image'
                    }
                };
            }

            // Find the image blob
            const imageBlobName =
                report.imageName
                    ? `report-${reportId}${report.imageName.includes('.')
                        ? report.imageName.substring(
                            report.imageName.lastIndexOf('.')
                        )
                        : ''
                    }`
                    : null;

            if (!imageBlobName) {
                return {
                    status: 404,
                    jsonBody: {
                        success: false,
                        error: 'Image not found'
                    }
                };
            }

            const imageBlobClient =
                containerClient.getBlobClient(imageBlobName);

            if (!(await imageBlobClient.exists())) {
                return {
                    status: 404,
                    jsonBody: {
                        success: false,
                        error: 'Image not found'
                    }
                };
            }

            const properties =
                await imageBlobClient.getProperties();

            const imageBuffer =
                await imageBlobClient.downloadToBuffer();

            return {
                status: 200,
                headers: {
                    'Content-Type':
                        properties.contentType || 'application/octet-stream'
                },
                body: imageBuffer
            };

        } catch (error) {
            context.error(error);

            return {
                status: 500,
                jsonBody: {
                    success: false,
                    error: error.message
                }
            };
        }
    }
});

app.http('update-report', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'report/{id}',

    handler: async (request, context) => {
        try {
            const user = getUserInfo(request);

            if (!user) {
                return {
                    status: 401,
                    jsonBody: {
                        success: false,
                        error: 'User is not authenticated'
                    }
                };
            }

            // Only Managers can edit reports
            if (!user.roles.includes('Manager')) {
                return {
                    status: 403,
                    jsonBody: {
                        success: false,
                        error: 'Only Managers can edit reports'
                    }
                };
            }

            const reportId = request.params.id;

            const body = await request.json();

            const blobServiceClient = new BlobServiceClient(
                `https://${storageAccountName}.blob.core.windows.net`,
                credential
            );

            const containerClient =
                blobServiceClient.getContainerClient(containerName);

            const jsonBlobName = `report-${reportId}.json`;

            const jsonBlobClient =
                containerClient.getBlockBlobClient(jsonBlobName);

            if (!(await jsonBlobClient.exists())) {
                return {
                    status: 404,
                    jsonBody: {
                        success: false,
                        error: 'Report not found'
                    }
                };
            }

            const reportData =
                await jsonBlobClient.downloadToBuffer();

            const report =
                JSON.parse(reportData.toString());

            // Only allow fields that the Manager is supposed to edit
            if (body.title !== undefined) {
                report.title = body.title;
            }

            if (body.description !== undefined) {
                report.description = body.description;
            }

            if (body.category !== undefined) {
                report.category = body.category;
            }

            report.updatedAt = new Date().toISOString();

            const updatedData =
                JSON.stringify(report);

            await jsonBlobClient.upload(
                updatedData,
                Buffer.byteLength(updatedData),
                {
                    blobHTTPHeaders: {
                        blobContentType: 'application/json'
                    },
                    overwrite: true
                }
            );

            return {
                status: 200,
                jsonBody: {
                    success: true,
                    report: report
                }
            };

        } catch (error) {
            context.error(error);

            return {
                status: 500,
                jsonBody: {
                    success: false,
                    error: error.message
                }
            };
        }
    }
});