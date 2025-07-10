using Microsoft.Extensions.Configuration;
using omp.Application.Common.Interfaces;
using System;
using System.IO;
using System.Threading.Tasks;

namespace omp.Infrastructure.Services
{
    public class ReferenceDocumentService : IReferenceDocumentService
    {
        private readonly IBlobStorageService _blobStorageService;
        private readonly string _containerName;

        public ReferenceDocumentService(
            IBlobStorageService blobStorageService,
            IConfiguration configuration)
        {
            _blobStorageService = blobStorageService;
            _containerName = "references-container";
        }

        public async Task<string> UploadDocumentAsync(Guid referenceId, string fileName, Stream content)
        {
            // Ensure file name is unique by adding a timestamp if needed
            string uniqueFileName = EnsureUniqueFileName(fileName);
            
            // Create blob path using Reference ID as folder path within the container
            string blobPath = GetBlobPath(referenceId, uniqueFileName);
            
            // Upload the document to the references-container
            return await _blobStorageService.UploadFileAsync(_containerName, blobPath, content);
        }

        public async Task<string> GetDocumentUrlAsync(Guid referenceId, string fileName)
        {
            // Get the blob path using the Reference ID and file name
            string blobPath = GetBlobPath(referenceId, fileName);
            
            // Get the URL of the document with SAS token
            return await _blobStorageService.GetFileUrlAsync(_containerName, blobPath);
        }

        public async Task<bool> DeleteDocumentAsync(Guid referenceId, string fileName)
        {
            // Get the blob path using the Reference ID and file name
            string blobPath = GetBlobPath(referenceId, fileName);
            
            // Delete the document from the Azure Blob Storage
            return await _blobStorageService.DeleteFileAsync(_containerName, blobPath);
        }

        private string GetBlobPath(Guid referenceId, string fileName)
        {
            // Use Reference ID as the folder name within the container
            return $"{referenceId}/{fileName}";
        }

        private string EnsureUniqueFileName(string fileName)
        {
            // Add timestamp to ensure uniqueness
            string extension = Path.GetExtension(fileName);
            string fileNameWithoutExt = Path.GetFileNameWithoutExtension(fileName);
            string timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmssfff");
            
            return $"{fileNameWithoutExt}_{timestamp}{extension}";
        }
    }
}