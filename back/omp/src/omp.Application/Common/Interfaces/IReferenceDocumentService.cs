using System;
using System.IO;
using System.Threading.Tasks;

namespace omp.Application.Common.Interfaces
{
    public interface IReferenceDocumentService
    {
        /// <summary>
        /// Uploads a document related to a Reference to Azure Blob Storage
        /// </summary>
        /// <param name="referenceId">The ID of the Reference</param>
        /// <param name="fileName">The name of the file</param>
        /// <param name="content">The content of the document file as a stream</param>
        /// <returns>The URL of the uploaded file with SAS token</returns>
        Task<string> UploadDocumentAsync(Guid referenceId, string fileName, Stream content);

        /// <summary>
        /// Gets the URL of a document related to a Reference
        /// </summary>
        /// <param name="referenceId">The ID of the Reference</param>
        /// <param name="fileName">The name of the file</param>
        /// <returns>The URL of the file with SAS token</returns>
        Task<string> GetDocumentUrlAsync(Guid referenceId, string fileName);

        /// <summary>
        /// Deletes a document related to a Reference
        /// </summary>
        /// <param name="referenceId">The ID of the Reference</param>
        /// <param name="fileName">The name of the file to delete</param>
        /// <returns>True if deletion is successful</returns>
        Task<bool> DeleteDocumentAsync(Guid referenceId, string fileName);
    }
}