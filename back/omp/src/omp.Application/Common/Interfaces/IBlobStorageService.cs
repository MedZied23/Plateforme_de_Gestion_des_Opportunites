using System;
using System.IO;
using System.Threading.Tasks;

namespace omp.Application.Common.Interfaces
{
    public interface IBlobStorageService
    {
        /// <summary>
        /// Uploads a file to Azure Blob Storage using SAS token
        /// </summary>
        /// <param name="containerName">The container name where the file will be stored</param>
        /// <param name="fileName">The name of the file to be stored</param>
        /// <param name="content">The content of the file as a stream</param>
        /// <returns>The URL of the uploaded file with SAS token</returns>
        Task<string> UploadFileAsync(string containerName, string fileName, Stream content);

        /// <summary>
        /// Generates a SAS token for the specified blob
        /// </summary>
        /// <param name="containerName">The container name</param>
        /// <param name="blobName">The blob name</param>
        /// <param name="expiryTime">The expiry time for the SAS token</param>
        /// <returns>A SAS token URL</returns>
        Task<string> GenerateSasTokenAsync(string containerName, string blobName, DateTimeOffset expiryTime);

        /// <summary>
        /// Gets the URL of a file with SAS token
        /// </summary>
        /// <param name="containerName">The container name</param>
        /// <param name="fileName">The file name</param>
        /// <returns>The URL with SAS token</returns>
        Task<string> GetFileUrlAsync(string containerName, string fileName);

        /// <summary>
        /// Deletes a file from Azure Blob Storage
        /// </summary>
        /// <param name="containerName">The container name</param>
        /// <param name="fileName">The file name to delete</param>
        /// <returns>True if deletion is successful</returns>
        Task<bool> DeleteFileAsync(string containerName, string fileName);
    }
}
