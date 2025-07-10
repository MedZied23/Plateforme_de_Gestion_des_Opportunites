using Microsoft.Extensions.Configuration;
using omp.Application.Common.Interfaces;
using System;
using System.IO;
using System.Threading.Tasks;

namespace omp.Infrastructure.Services
{    public class OpportunitéDocumentService : IOpportunitéDocumentService
    {
        private readonly IBlobStorageService _blobStorageService;
        private readonly string _containerName;

        public OpportunitéDocumentService(
            IBlobStorageService blobStorageService,
            IConfiguration configuration)
        {
            _blobStorageService = blobStorageService;
            _containerName = "ocr-container";
        }        public async Task<string> UploadDocumentAsync(Guid opportunitéId, string fileName, Stream content)
        {
            // Ensure file name is unique by adding a timestamp if needed
            string uniqueFileName = EnsureUniqueFileName(fileName);
            
            // Create blob path using opportunité ID as folder path within the container
            string blobPath = GetBlobPath(opportunitéId, uniqueFileName);
            
            // Upload the document to the fixed container
            return await _blobStorageService.UploadFileAsync(_containerName, blobPath, content);
        }        public async Task<string> GetDocumentUrlAsync(Guid opportunitéId, string fileName)
        {
            string blobPath = GetBlobPath(opportunitéId, fileName);
            return await _blobStorageService.GetFileUrlAsync(_containerName, blobPath);
        }        public async Task<bool> DeleteDocumentAsync(Guid opportunitéId, string fileName)
        {
            string blobPath = GetBlobPath(opportunitéId, fileName);
            return await _blobStorageService.DeleteFileAsync(_containerName, blobPath);
        }        private string GetBlobPath(Guid opportunitéId, string fileName)
        {
            // Return just the filename to store directly in the container root
            // Add opportunitéId as prefix to ensure uniqueness across different opportunities
            return $"{opportunitéId}_{fileName}";
        }

        private string EnsureUniqueFileName(string fileName)
        {
            // Get file extension
            string extension = Path.GetExtension(fileName);
            
            // Get file name without extension
            string fileNameWithoutExtension = Path.GetFileNameWithoutExtension(fileName);
            
            // Add timestamp to ensure uniqueness
            string timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
            
            // Return unique file name
            return $"{fileNameWithoutExtension}-{timestamp}{extension}";
        }
    }
}
