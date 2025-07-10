using System;
using System.IO;
using System.Threading.Tasks;

namespace omp.Application.Common.Interfaces
{    public interface IOpportunitéDocumentService
    {        /// <summary>
        /// Uploads a document (PDF or Word) related to an Opportunité to Azure Blob Storage
        /// </summary>
        /// <param name="opportunitéId">The ID of the Opportunité</param>
        /// <param name="fileName">The name of the file</param>
        /// <param name="content">The content of the document file as a stream</param>
        /// <returns>The URL of the uploaded file with SAS token</returns>
        Task<string> UploadDocumentAsync(Guid opportunitéId, string fileName, Stream content);        /// <summary>
        /// Gets the URL of a document (PDF or Word) related to an Opportunité
        /// </summary>
        /// <param name="opportunitéId">The ID of the Opportunité</param>
        /// <param name="fileName">The name of the file</param>
        /// <returns>The URL with SAS token</returns>
        Task<string> GetDocumentUrlAsync(Guid opportunitéId, string fileName);

        /// <summary>
        /// Deletes a document (PDF or Word) related to an Opportunité
        /// </summary>        /// <param name="opportunitéId">The ID of the Opportunité</param>
        /// <param name="fileName">The name of the file to delete</param>
        /// <returns>True if deletion is successful</returns>
        Task<bool> DeleteDocumentAsync(Guid opportunitéId, string fileName);
    }
}
