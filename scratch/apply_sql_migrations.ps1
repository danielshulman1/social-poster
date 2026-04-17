$PSQL = "C:\Program Files\PostgreSQL\13\bin\psql.exe"
$DB_URL = "postgresql://postgres:Dcdefe367e4e4.@db.cjwhglwnbsrkidgvngqr.supabase.co:5432/postgres?sslmode=require"
$MIGRATIONS_DIR = "packages/frontend/database/migrations"
11

function Run-Query($query) {
    & $PSQL -d $DB_URL -t -c $query
}

$tables = @("user_tiers", "admin_logs", "user_personas", "interview_progress")

foreach ($table in $tables) {
    $exists = Run-Query "SELECT 1 FROM information_schema.tables WHERE table_name = '$table';"
    if ($exists -match "1") {
        Write-Host "Table $table already exists." -ForegroundColor Green
    } else {
        Write-Host "Table $table does not exist. Applying migration..." -ForegroundColor Yellow
        # Find the migration file starting with the corresponding number
        $file = Get-ChildItem $MIGRATIONS_DIR -Filter "*$table*.sql" | Select-Object -First 1
        if ($file) {
            Write-Host "Applying $($file.FullName)..."
            & $PSQL -d $DB_URL -f $file.FullName
        } else {
            Write-Host "Migration file for $table not found!" -ForegroundColor Red
        }
    }
}
