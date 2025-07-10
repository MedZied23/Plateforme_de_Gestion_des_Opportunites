using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using omp.Infrastructure.Persistence;

namespace omp.API.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class HealthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<HealthController> _logger;

        public HealthController(ApplicationDbContext context, ILogger<HealthController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            try
            {
                // Check database connection
                await _context.Database.CanConnectAsync();
                
                var healthStatus = new
                {
                    Status = "Healthy",
                    Timestamp = DateTime.UtcNow,
                    Database = "Connected",
                    Version = "1.0.0"
                };

                return Ok(healthStatus);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Health check failed");
                
                var healthStatus = new
                {
                    Status = "Unhealthy",
                    Timestamp = DateTime.UtcNow,
                    Database = "Disconnected",
                    Error = ex.Message,
                    Version = "1.0.0"
                };

                return StatusCode(503, healthStatus);
            }
        }

        [HttpGet("ready")]
        public async Task<IActionResult> Ready()
        {
            try
            {
                // More comprehensive readiness check
                await _context.Database.CanConnectAsync();
                
                // You can add more checks here, like:
                // - External API availability
                // - Required services status
                // - Cache connectivity
                
                return Ok(new { Status = "Ready", Timestamp = DateTime.UtcNow });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Readiness check failed");
                return StatusCode(503, new { Status = "Not Ready", Error = ex.Message });
            }
        }

        [HttpGet("live")]
        public IActionResult Live()
        {
            // Basic liveness check - just return that the application is running
            return Ok(new { Status = "Alive", Timestamp = DateTime.UtcNow });
        }
    }
}
