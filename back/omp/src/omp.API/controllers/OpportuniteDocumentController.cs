using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using omp.Application.Common.Interfaces;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace omp.API.controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class OpportuniteDocumentController : ControllerBase
    {
        private readonly IOpportunitéDocumentService _documentService;

        public OpportuniteDocumentController(IOpportunitéDocumentService documentService)
        {
            _documentService = documentService;
        }        /// <summary>
        /// Uploads a document (PDF or Word) for an opportunité
        /// </summary>
        /// <param name="opportuniteId">The ID of the opportunité</param>
        /// <param name="file">The document file to upload (PDF, DOC, or DOCX)</param>
        /// <returns>The URL with SAS token to access the uploaded file</returns>
        [HttpPost("{opportuniteId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> UploadDocument(Guid opportuniteId, IFormFile file)
        {
            try
            {                // Validate the file
                if (file == null || file.Length == 0)
                {
                    return BadRequest("No file uploaded");
                }

                // Validate file extension (allow PDF and Word documents)
                var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
                  // Use a simpler validation approach
                if (fileExtension != ".pdf" && fileExtension != ".doc" && fileExtension != ".docx")
                {
                    return BadRequest($"Only PDF and Word documents are allowed. Received file with extension: {fileExtension}");
                }

                // Validate file size (limit to 50MB)
                if (file.Length > 50 * 1024 * 1024)
                {
                    return BadRequest("File size cannot exceed 50MB");
                }// Upload the file
                using var stream = file.OpenReadStream();
                var fileUrl = await _documentService.UploadDocumentAsync(opportuniteId, file.FileName, stream);

                // Return the URL with SAS token
                return Ok(new { fileUrl });
            }
            catch (Exception ex)
            {
                // Log the exception
                return StatusCode(StatusCodes.Status500InternalServerError, 
                    new { message = "An error occurred while uploading the document", error = ex.Message });
            }
        }        /// <summary>
        /// Gets the URL with SAS token for a document (PDF or Word)
        /// </summary>
        /// <param name="opportuniteId">The ID of the opportunité</param>
        /// <param name="fileName">The name of the file</param>
        /// <returns>The URL with SAS token to access the file</returns>
        [HttpGet("{opportuniteId}/{fileName}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetDocumentUrl(Guid opportuniteId, string fileName)
        {
            try
            {
                var fileUrl = await _documentService.GetDocumentUrlAsync(opportuniteId, fileName);

                if (string.IsNullOrEmpty(fileUrl))
                {
                    return NotFound("Document not found");
                }

                return Ok(new { fileUrl });
            }
            catch (Exception ex)
            {
                // Log the exception
                return StatusCode(StatusCodes.Status500InternalServerError, 
                    new { message = "An error occurred while retrieving the document", error = ex.Message });
            }
        }        /// <summary>
        /// Deletes a document (PDF or Word)
        /// </summary>
        /// <param name="opportuniteId">The ID of the opportunité</param>
        /// <param name="fileName">The name of the file to delete</param>
        /// <returns>A success message</returns>
        [HttpDelete("{opportuniteId}/{fileName}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> DeleteDocument(Guid opportuniteId, string fileName)
        {
            try
            {
                var result = await _documentService.DeleteDocumentAsync(opportuniteId, fileName);

                if (!result)
                {
                    return NotFound("Document not found or could not be deleted");
                }

                return Ok(new { message = "Document deleted successfully" });
            }
            catch (Exception ex)
            {
                // Log the exception
                return StatusCode(StatusCodes.Status500InternalServerError, 
                    new { message = "An error occurred while deleting the document", error = ex.Message });
            }
        }
    }
}
