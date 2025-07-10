using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using omp.Application.Common.Interfaces;
using System.IO;

namespace omp.API.controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ReferenceDocumentController : ControllerBase
    {
        private readonly IReferenceDocumentService _documentService;
        private readonly IApplicationDbContext _context;

        public ReferenceDocumentController(IReferenceDocumentService documentService, IApplicationDbContext context)
        {
            _documentService = documentService;
            _context = context;
        }

        /// <summary>
        /// Uploads a Reference document
        /// </summary>
        /// <param name="referenceId">The ID of the Reference</param>
        /// <param name="file">The file to upload</param>
        /// <returns>The URL with SAS token to access the file</returns>
        [HttpPost("{referenceId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> UploadDocument(Guid referenceId, IFormFile file)
        {
            try
            {
                // Validate the file
                if (file == null || file.Length == 0)
                {
                    return BadRequest("No file uploaded");
                }

                // Validate file extension (allow PDF, Word, and PowerPoint documents)
                var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (fileExtension != ".pdf" && fileExtension != ".doc" && fileExtension != ".docx" && 
                    fileExtension != ".ppt" && fileExtension != ".pptx")
                {
                    return BadRequest($"Only PDF, Word, and PowerPoint documents are allowed. Received file with extension: {fileExtension}");
                }

                // Validate file size (limit to 50MB)
                if (file.Length > 50 * 1024 * 1024)
                {
                    return BadRequest("File size cannot exceed 50MB");
                }

                // Find the Reference
                var reference = await _context.References.FindAsync(referenceId);
                if (reference == null)
                {
                    return NotFound($"Reference with ID {referenceId} not found");
                }

                // Upload the file
                using var stream = file.OpenReadStream();
                var fileUrl = await _documentService.UploadDocumentAsync(referenceId, file.FileName, stream);

                // Update the Reference entity with the document URL and timestamp
                reference.DocumentUrl = fileUrl;
                reference.LastModified = DateTime.UtcNow;
                reference.LastAccessed = DateTime.UtcNow;
                await _context.SaveChangesAsync(new System.Threading.CancellationToken());

                // Return the URL with SAS token
                return Ok(new { fileUrl });
            }
            catch (Exception ex)
            {
                // Log the exception
                return StatusCode(StatusCodes.Status500InternalServerError, 
                    new { message = "An error occurred while uploading the Reference document", error = ex.Message });
            }
        }

        /// <summary>
        /// Gets the URL with SAS token for a Reference document
        /// </summary>
        /// <param name="referenceId">The ID of the Reference</param>
        /// <param name="fileName">The name of the file</param>
        /// <returns>The URL with SAS token to access the file</returns>
        [HttpGet("{referenceId}/{fileName}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetDocumentUrl(Guid referenceId, string fileName)
        {
            try
            {                // First check if the Reference exists and has a document URL
                var reference = await _context.References.FindAsync(referenceId);
                if (reference == null)
                {
                    return NotFound($"Reference with ID {referenceId} not found");
                }

                // Update LastAccessed timestamp
                reference.LastAccessed = DateTime.UtcNow;
                await _context.SaveChangesAsync(new System.Threading.CancellationToken());                // Always generate a new URL with a fresh SAS token
                var fileUrl = await _documentService.GetDocumentUrlAsync(referenceId, fileName);
                
                if (string.IsNullOrEmpty(fileUrl))
                {
                    return NotFound($"No document found for Reference ID: {referenceId} with name: {fileName}");
                }

                // Update the stored URL in the database to keep it fresh
                reference.DocumentUrl = fileUrl;
                await _context.SaveChangesAsync(new System.Threading.CancellationToken());
                
                return Ok(new { fileUrl });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, 
                    new { message = "An error occurred while getting the Reference document URL", error = ex.Message });
            }
        }

        /// <summary>
        /// Deletes a Reference document
        /// </summary>
        /// <param name="referenceId">The ID of the Reference</param>
        /// <param name="fileName">The name of the file to delete</param>
        /// <returns>Success status</returns>
        [HttpDelete("{referenceId}/{fileName}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> DeleteDocument(Guid referenceId, string fileName)
        {
            try
            {
                // Find the Reference
                var reference = await _context.References.FindAsync(referenceId);
                if (reference == null)
                {
                    return NotFound($"Reference with ID {referenceId} not found");
                }

                var result = await _documentService.DeleteDocumentAsync(referenceId, fileName);
                
                if (!result)
                {
                    return NotFound($"No document found for Reference ID: {referenceId} with name: {fileName}");
                }
                  // Clear the document URL from the Reference entity
                reference.DocumentUrl = null;
                reference.LastModified = DateTime.UtcNow;
                await _context.SaveChangesAsync(new System.Threading.CancellationToken());
                
                return Ok(new { message = "Document deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, 
                    new { message = "An error occurred while deleting the Reference document", error = ex.Message });
            }
        }
    }
}