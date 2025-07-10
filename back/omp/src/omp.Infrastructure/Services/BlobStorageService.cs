using Azure.Storage;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Azure.Storage.Sas;
using Microsoft.Extensions.Configuration;
using omp.Application.Common.Interfaces;
using System;
using System.IO;
using System.Threading.Tasks;

namespace omp.Infrastructure.Services
{
    public class BlobStorageService : IBlobStorageService
    {
        private readonly string _connectionString;
        private readonly string _accountName;
        private readonly string _accountKey;

        public BlobStorageService(IConfiguration configuration)
        {
            _connectionString = configuration["AzureBlobStorage:ConnectionString"] 
                ?? throw new ArgumentNullException("Azure Blob Storage connection string is not configured");
            _accountName = configuration["AzureBlobStorage:AccountName"] 
                ?? throw new ArgumentNullException("Azure Blob Storage account name is not configured");
            _accountKey = configuration["AzureBlobStorage:AccountKey"] 
                ?? throw new ArgumentNullException("Azure Blob Storage account key is not configured");
        }

        public async Task<string> UploadFileAsync(string containerName, string fileName, Stream content)
        {
            // Create a container client
            var containerClient = new BlobContainerClient(_connectionString, containerName);
            
            // Create the container if it doesn't exist
            await containerClient.CreateIfNotExistsAsync(PublicAccessType.None);

            // Create a blob client
            var blobClient = containerClient.GetBlobClient(fileName);

            // Upload the file
            await blobClient.UploadAsync(content, overwrite: true);

            // Generate SAS token with read permission
            var sasToken = await GenerateSasTokenAsync(containerName, fileName, DateTimeOffset.UtcNow.AddYears(100));
            
            return sasToken;
        }

        public async Task<string> GenerateSasTokenAsync(string containerName, string blobName, DateTimeOffset expiryTime)
        {
            // Get storage credentials
            var storageSharedKeyCredential = new StorageSharedKeyCredential(_accountName, _accountKey);
            
            // Create a blob client
            var containerClient = new BlobContainerClient(_connectionString, containerName);
            var blobClient = containerClient.GetBlobClient(blobName);

            // Check if blob exists
            if (!await blobClient.ExistsAsync())
            {
                return string.Empty;
            }

            // Create SAS token that's valid for the specified duration
            var sasBuilder = new BlobSasBuilder
            {
                BlobContainerName = containerName,
                BlobName = blobName,
                Resource = "b", // b for blob
                ExpiresOn = expiryTime
            };

            // Set permissions
            sasBuilder.SetPermissions(BlobSasPermissions.Read);

            // Generate the SAS token
            var sasToken = sasBuilder.ToSasQueryParameters(storageSharedKeyCredential).ToString();

            // Return the full URL with SAS token
            return $"{blobClient.Uri}?{sasToken}";
        }

        public async Task<string> GetFileUrlAsync(string containerName, string fileName)
        {
            var containerClient = new BlobContainerClient(_connectionString, containerName);
            var blobClient = containerClient.GetBlobClient(fileName);

            // Check if blob exists
            if (!await blobClient.ExistsAsync())
            {
                return string.Empty;
            }

            // Generate SAS token with read permission
            var sasToken = await GenerateSasTokenAsync(containerName, fileName, DateTimeOffset.UtcNow.AddHours(1));
            
            return sasToken;
        }

        public async Task<bool> DeleteFileAsync(string containerName, string fileName)
        {
            var containerClient = new BlobContainerClient(_connectionString, containerName);
            var blobClient = containerClient.GetBlobClient(fileName);

            // Delete the blob
            var response = await blobClient.DeleteIfExistsAsync();
            
            return response.Value;
        }
    }
}
