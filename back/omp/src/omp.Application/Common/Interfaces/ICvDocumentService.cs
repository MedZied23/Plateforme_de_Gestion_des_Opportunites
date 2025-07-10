using System;
using System.IO;
using System.Threading.Tasks;

namespace omp.Application.Common.Interfaces
{
    public interface ICvDocumentService
    {
        /// <summary>
        /// Uploads a document (PDF or Word) related to a CV to Azure Blob Storage
        /// </summary>
        /// <param name="cvId">The ID of the CV</param>
        /// <param name="fileName">The name of the file</param>
        /// <param name="content">The content of the document file as a stream</param>
        /// <returns>The URL of the uploaded file with SAS token</returns>
        Task<string> UploadDocumentAsync(Guid cvId, string fileName, Stream content);

        /// <summary>
        /// Gets the URL of a document (PDF or Word) related to a CV
        /// </summary>
        /// <param name="cvId">The ID of the CV</param>
        /// <param name="fileName">The name of the file</param>
        /// <returns>The URL of the file with SAS token</returns>
        Task<string> GetDocumentUrlAsync(Guid cvId, string fileName);

        /// <summary>
        /// Deletes a document (PDF or Word) related to a CV
        /// </summary>
        /// <param name="cvId">The ID of the CV</param>
        /// <param name="fileName">The name of the file to delete</param>
        /// <returns>True if deletion is successful</returns>
        Task<bool> DeleteDocumentAsync(Guid cvId, string fileName);
    }
}