#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <omp.h>

int getAvailableCores(void){
    int count = 0;
    FILE* f = fopen("/proc/cpuinfo", "r");
    if(!f) return 1;
    char line[256];
    while(fgets(line, sizeof(line), f)){
        if(strncmp(line, "processor", 9) == 0) count++;
    }
    fclose(f);
    return count > 0 ? count : 1;
}

char* buildTape(int n){
    char* t = (char*)malloc(n + 2);
    memset(t, '1', n);
    t[n]   = '0';
    t[n+1] = '\0';
    return t;
}

void printReport(double serialTime, double parallelTime, int threads, int cores){
    double speedup    = serialTime / parallelTime;
    double efficiency = (speedup / threads) * 100.0;
    
    printf("         PERFORMANCE REPORT               \n");   
    printf("  Cores used       : %5d                 \n", cores);
    printf("  Threads used     : %5d                 \n", threads);
    printf("  Serial  time (s) : %12.6f           \n", serialTime);
    printf("  Parallel time (s): %12.6f           \n", parallelTime);
    printf("  Speedup          : %8.4f               \n", speedup);
    printf("  Efficiency       : %7.4f%%              \n", efficiency);
}


int serial_addition(int a, int b)       { return a + b; }
int serial_subtraction(int a, int b)    { return (a >= b) ? (a - b) : 0; }
int serial_multiplication(int a, int b) { return a * b; }
int serial_division(int a, int b)       { return (b > 0 && a >= b) ? (a / b) : 0; }
int serial_modulo(int a, int b)         { return (b > 0) ? (a % b) : -1; }



int addition(int a, int b, int threads, int cores, int verbose){
    char* tape1 = buildTape(a);
    char* tape2 = buildTape(b);
    int   n1    = a + 1;
    int   n2    = b + 1;
    int   total = n1 + n2;
    char* tape  = (char*)malloc(total + 1);
    memcpy(tape,      tape1, n1);
    memcpy(tape + n1, tape2, n2);
    tape[total] = '\0';

    if(verbose) printf("\nInitial tape : %s\n", tape);

    double s0 = omp_get_wtime();
    int serial_ans = serial_addition(a, b);
    double serialTime = omp_get_wtime() - s0;

    int par_ans = 0;
    double p0 = omp_get_wtime();
    #pragma omp parallel for reduction(+:par_ans) schedule(static) num_threads(threads)
    for(int i = 0; i < total; i++){
        if(tape[i] == '1') par_ans++;
    }
    double parallelTime = omp_get_wtime() - p0;

    if(verbose){
        char* result = (char*)malloc(par_ans + 1);
        memset(result, '1', par_ans);
        result[par_ans] = '\0';
        printf("Tape after addition : %s\n", result);
        printf("Result of %d + %d = %d\n", a, b, par_ans);
        printReport(serialTime, parallelTime, threads, cores);
        free(result);
    }

    free(tape1); free(tape2); free(tape);
    return par_ans;
}

int subtraction(int a, int b, int threads, int cores, int verbose){
    char* tapeA = buildTape(a);
    char* tapeB = buildTape(b);
    int   n1    = a + 1;
    int   n2    = b + 1;
    int   total = n1 + n2;
    char* tape  = (char*)malloc(total + 1);
    memcpy(tape,      tapeA, n1);
    memcpy(tape + n1, tapeB, n2);
    tape[total] = '\0';

    if(verbose) printf("\nInitial tape : %s\n", tape);

    if(b > a){
        if(verbose){
            printf("Result (b>a): 0 - tape blanked.\n");
            memset(tape, '0', total);
            printf("Final tape: %s\n", tape);
        }
        free(tapeA); free(tapeB); free(tape);
        return 0;
    }

    double s0 = omp_get_wtime();
    int serial_ans = serial_subtraction(a, b);
    double serialTime = omp_get_wtime() - s0;

    int minLen = (a < b) ? a : b;
    double p0 = omp_get_wtime();
    #pragma omp parallel for schedule(static) num_threads(threads)
    for(int i = 0; i < minLen; i++){
        if(tapeA[i] == '1' && tapeB[i] == '1'){
            tapeA[i] = 'x';
            tapeB[i] = 'y';
        }
    }
    int par_ans = 0;
    #pragma omp parallel for reduction(+:par_ans) schedule(static) num_threads(threads)
    for(int i = 0; i < a; i++){
        if(tapeA[i] == '1') par_ans++;
    }
    double parallelTime = omp_get_wtime() - p0;

    if(verbose){
        memcpy(tape, tapeA, n1);
        memcpy(tape + n1, tapeB, n2);
        tape[total] = '\0';
        printf("Final tape : %s\n", tape);
        printf("Result of %d - %d = %d\n", a, b, par_ans);
        printReport(serialTime, parallelTime, threads, cores);
    }

    free(tapeA); free(tapeB); free(tape);
    return par_ans;
}

int multiplication(int a, int b, int threads, int cores, int verbose){
    char* tape1 = buildTape(a);
    char* tape2 = buildTape(b);
    int   n1    = a + 1;
    int   n2    = b + 1;
    int   total = n1 + n2;
    char* tape  = (char*)malloc(total + 1);
    memcpy(tape,      tape1, n1);
    memcpy(tape + n1, tape2, n2);
    tape[total] = '\0';

    if(verbose) printf("\nInitial tape : %s\n", tape);

    double s0 = omp_get_wtime();
    int serial_ans = serial_multiplication(a, b);
    double serialTime = omp_get_wtime() - s0;

    int par_ans = 0;
    double p0 = omp_get_wtime();
    #pragma omp parallel for reduction(+:par_ans) schedule(static) num_threads(threads)
    for(int k = 0; k < a; k++){
        par_ans += b;
    }
    double parallelTime = omp_get_wtime() - p0;

    if(verbose){
        char* result = (char*)malloc(par_ans + 1);
        memset(result, '1', par_ans);
        result[par_ans] = '\0';
        printf("Tape after multiplication : %s\n", result);
        printf("Result of %d x %d = %d\n", a, b, par_ans);
        printReport(serialTime, parallelTime, threads, cores);
        free(result);
    }

    free(tape1); free(tape2); free(tape);
    return par_ans;
}

int division_op(int a, int b, int threads, int cores, int verbose){
    if(b <= 0){ if(verbose) printf("Invalid divisor!\n"); return -1; }
    if(a <  b){ if(verbose) printf("Machine halted! (%d < %d)\n", a, b); return -1; }

    char* tape1 = buildTape(a);
    char* tape2 = buildTape(b);
    int   n1    = a + 1;
    int   n2    = b + 1;
    int   total = n1 + n2;
    char* tape  = (char*)malloc(total + 1);
    memcpy(tape,      tape1, n1);
    memcpy(tape + n1, tape2, n2);
    tape[total] = '\0';

    if(verbose) printf("\nInitial Tape : %s\n", tape1);

    double s0 = omp_get_wtime();
    int serial_ans = serial_division(a, b);
    double serialTime = omp_get_wtime() - s0;

    int quotient   = a / b;
    int remainder  = a % b;
    int for1stzero = a;

    double p0 = omp_get_wtime();
    #pragma omp parallel for schedule(static) num_threads(threads)
    for(int q = 0; q < quotient; q++){
        int start = q * b;
        for(int i = start; i < start + b && i < for1stzero; i++)
            tape[i] = 'x';
    }
    double parallelTime = omp_get_wtime() - p0;

    if(verbose){
        printf("Final Tape : %s\n", tape);
        printf("Quotient   : %d\n", quotient);
        printf("Remainder  : %d\n", remainder);
        printReport(serialTime, parallelTime, threads, cores);
    }

    free(tape1); free(tape2); free(tape);
    return quotient;
}

int modulo(int a, int b, int threads, int cores, int verbose){
    if(b <= 0){ if(verbose) printf("Invalid entry!\n"); return -1; }
    if(a <  b){ if(verbose) printf("Answer of %d %% %d = %d\n", a, b, a); return a; }

    char* tape1 = buildTape(a);
    char* tape2 = buildTape(b);
    int   n1    = a + 1;
    int   n2    = b + 1;
    int   total = n1 + n2;
    char* tape  = (char*)malloc(total + 1);
    memcpy(tape,      tape1, n1);
    memcpy(tape + n1, tape2, n2);
    tape[total] = '\0';

    if(verbose) printf("\nInitial Tape : %s\n", tape);

    double s0 = omp_get_wtime();
    int serial_ans = serial_modulo(a, b);
    double serialTime = omp_get_wtime() - s0;

    int quotient   = a / b;
    int remainder  = a % b;
    int for1stzero = a;

    double p0 = omp_get_wtime();
    #pragma omp parallel for schedule(static) num_threads(threads)
    for(int q = 0; q < quotient; q++){
        int start = q * b;
        for(int i = start; i < start + b && i < for1stzero; i++)
            tape[i] = 'x';
    }
    double parallelTime = omp_get_wtime() - p0;

    if(verbose){
        printf("Final Tape : %s\n", tape);
        printf("Answer of %d %% %d = %d\n", a, b, remainder);
        printReport(serialTime, parallelTime, threads, cores);
    }

    free(tape1); free(tape2); free(tape);
    return remainder;
}


int main(int argc, char* argv[]){

    int maxCores = getAvailableCores();
    
    printf("  Parallel Turing Machine \n");
    printf("  System detected cores : %d\n\n", maxCores);

    int numCores;
    while(1){
        printf("Enter number of CPU cores to use (1-%d): ", maxCores);
        if(scanf("%d", &numCores) != 1){ while(getchar()!='\n'); continue; }
        if(numCores >= 1 && numCores <= maxCores) break;
        printf("  ERROR: This Ubuntu instance only has %d core(s). "
               "Enter a value between 1 and %d.\n", maxCores, maxCores);
    }
    int numThreads;
    while(1){
        printf("Enter number of threads per core  : ");
        if(scanf("%d", &numThreads) != 1){ while(getchar()!='\n'); continue; }
        if(numThreads >= 1) break;
        printf("  ERROR: Thread count must be at least 1.\n");
    }

    int totalThreads = numCores * numThreads;
    printf("\nRunning with %d total thread(s) (%d core(s) x %d thread(s)/core)\n",
           totalThreads, numCores, numThreads);

    int op;
    printf("\nSelect operation:\n"
           "  1: Addition\n"
           "  2: Subtraction\n"
           "  3: Multiplication\n"
           "  4: Division\n"
           "  5: Modulo\n"
           "Choice: ");
    while(scanf("%d", &op) != 1 || op < 1 || op > 5){
        while(getchar()!='\n');
        printf("  Invalid. Enter 1-5: ");
    }

    int a, b;
    printf("Enter first number  : "); scanf("%d", &a);
    printf("Enter second number : "); scanf("%d", &b);
    printf("\n─────────────────────────────────────────\n");
    switch(op){
        case 1: addition      (a, b, totalThreads, numCores, 1); break;
        case 2: subtraction   (a, b, totalThreads, numCores, 1); break;
        case 3: multiplication(a, b, totalThreads, numCores, 1); break;
        case 4: division_op   (a, b, totalThreads, numCores, 1); break;
        case 5: modulo        (a, b, totalThreads, numCores, 1); break;
    }

    return 0;
}
