#include <stdio.h>

int main()
{
	puts("#include <stdio.h>");
	puts("");
	int a, *p = &a;
	puts("int a, *p = &a;");
	void *v = &a;
	puts("void *v = &a;");
	int *&r = p;
	puts("int *&r = p;");
	puts("");

	printf("sizeof(p): %ld\n", sizeof(p));
	printf("sizeof(a): %ld\n", sizeof(a));
	printf("p:     %p\n", p);
	printf("p + 2: %p\n", p + 2);
	printf("&p:    %p\n", &p);
	printf("r:     %p\n", r);
	printf("&r:    %p\n", &r);
}
