using System;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using omp.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.IO;

namespace omp.API.controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class CvDocumentController : ControllerBase
    {
        private readonly ICvDocumentService _documentService;
        private readonly IApplicationDbContext _context;

        public CvDocumentController(ICvDocumentService documentService, IApplicationDbContext context)
        {
            _documentService = documentService;
            _context = context;
        }

        /// <summary>
        /// Uploads a CV document (PDF or Word)
        /// </summary>
        /// <param name="cvId">The ID of the CV</param>
        /// <param name="file">The file to upload</param>
        /// <returns>The URL with SAS token to access the file</returns>
        [HttpPost("{cvId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> UploadDocument(Guid cvId, IFormFile file)
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

                // Find the CV
                var cv = await _context.Cvs.FindAsync(cvId);
                if (cv == null)
                {
                    return NotFound($"CV with ID {cvId} not found");
                }                // Upload the file
                using var stream = file.OpenReadStream();
                var fileUrl = await _documentService.UploadDocumentAsync(cvId, file.FileName, stream);

                // Update the CV entity with the document URL and timestamp
                cv.documentUrl = fileUrl;
                cv.LastModified = DateTime.UtcNow;
                cv.LastAccessed = DateTime.UtcNow;
                await _context.SaveChangesAsync(new System.Threading.CancellationToken());

                // Return the URL with SAS token
                return Ok(new { fileUrl });
            }
            catch (Exception ex)
            {
                // Log the exception
                return StatusCode(StatusCodes.Status500InternalServerError, 
                    new { message = "An error occurred while uploading the CV document", error = ex.Message });
            }
        }

        /// <summary>
        /// Gets the URL with SAS token for a CV document
        /// </summary>
        /// <param name="cvId">The ID of the CV</param>
        /// <param name="fileName">The name of the file</param>
        /// <returns>The URL with SAS token to access the file</returns>
        [HttpGet("{cvId}/{fileName}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetDocumentUrl(Guid cvId, string fileName)
        {
            try
            {                // First check if the CV exists and has a document URL
                var cv = await _context.Cvs.FindAsync(cvId);
                if (cv == null)
                {
                    return NotFound($"CV with ID {cvId} not found");
                }

                // Update LastAccessed timestamp
                cv.LastAccessed = DateTime.UtcNow;
                await _context.SaveChangesAsync(new System.Threading.CancellationToken());

                // If the document URL is already stored, return it
                if (!string.IsNullOrEmpty(cv.documentUrl))
                {
                    return Ok(new { fileUrl = cv.documentUrl });
                }

                // Otherwise, generate a new URL from storage
                var fileUrl = await _documentService.GetDocumentUrlAsync(cvId, fileName);
                
                if (string.IsNullOrEmpty(fileUrl))
                {
                    return NotFound($"No document found for CV ID: {cvId} with name: {fileName}");
                }
                
                return Ok(new { fileUrl });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, 
                    new { message = "An error occurred while getting the CV document URL", error = ex.Message });
            }
        }

        /// <summary>
        /// Deletes a CV document
        /// </summary>
        /// <param name="cvId">The ID of the CV</param>
        /// <param name="fileName">The name of the file to delete</param>
        /// <returns>Success status</returns>
        [HttpDelete("{cvId}/{fileName}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> DeleteDocument(Guid cvId, string fileName)
        {
            try
            {
                // Find the CV
                var cv = await _context.Cvs.FindAsync(cvId);
                if (cv == null)
                {
                    return NotFound($"CV with ID {cvId} not found");
                }

                var result = await _documentService.DeleteDocumentAsync(cvId, fileName);
                
                if (!result)
                {
                    return NotFound($"No document found for CV ID: {cvId} with name: {fileName}");
                }
                  // Clear the document URL from the CV entity
                cv.documentUrl = null;
                cv.LastModified = DateTime.UtcNow;
                await _context.SaveChangesAsync(new System.Threading.CancellationToken());
                
                return Ok(new { message = "Document deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, 
                    new { message = "An error occurred while deleting the CV document", error = ex.Message });
            }
        }
    }
}