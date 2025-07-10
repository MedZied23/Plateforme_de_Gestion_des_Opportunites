using Microsoft.Extensions.Configuration;
using omp.Application.Common.Interfaces;
using System;
using System.IO;
using System.Threading.Tasks;

namespace omp.Infrastructure.Services
{
    public class CvDocumentService : ICvDocumentService
    {
        private readonly IBlobStorageService _blobStorageService;
        private readonly string _containerName;

        public CvDocumentService(
            IBlobStorageService blobStorageService,
            IConfiguration configuration)
        {
            _blobStorageService = blobStorageService;
            _containerName = "cvs-container";
        }

        public async Task<string> UploadDocumentAsync(Guid cvId, string fileName, Stream content)
        {
            // Ensure file name is unique by adding a timestamp if needed
            string uniqueFileName = EnsureUniqueFileName(fileName);
            
            // Create blob path using CV ID as folder path within the container
            string blobPath = GetBlobPath(cvId, uniqueFileName);
            
            // Upload the document to the cvs-container
            return await _blobStorageService.UploadFileAsync(_containerName, blobPath, content);
        }

        public async Task<string> GetDocumentUrlAsync(Guid cvId, string fileName)
        {
            // Get the blob path using the CV ID and file name
            string blobPath = GetBlobPath(cvId, fileName);
            
            // Get the URL of the document with SAS token
            return await _blobStorageService.GetFileUrlAsync(_containerName, blobPath);
        }

        public async Task<bool> DeleteDocumentAsync(Guid cvId, string fileName)
        {
            // Get the blob path using the CV ID and file name
            string blobPath = GetBlobPath(cvId, fileName);
            
            // Delete the document from the Azure Blob Storage
            return await _blobStorageService.DeleteFileAsync(_containerName, blobPath);
        }

        private string GetBlobPath(Guid cvId, string fileName)
        {
            // Use CV ID as the folder name within the container
            return $"{cvId}/{fileName}";
        }

        private string EnsureUniqueFileName(string fileName)
        {
            // Extract the file name and extension
            string extension = Path.GetExtension(fileName);
            string nameWithoutExtension = Path.GetFileNameWithoutExtension(fileName);
            
            // Add timestamp to ensure uniqueness
            string timestamp = DateTime.Now.ToString("yyyyMMddHHmmss");
            
            // Return the formatted unique file name
            return $"{nameWithoutExtension}_{timestamp}{extension}";
        }
    }
}